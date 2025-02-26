import { GraphQLError } from 'graphql';

export const chatResolvers = {
  Query: {
    thread: async (_, { id }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to view threads', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const thread = await dataSources.chatAPI.getThread(id);
      
      // Check if user is a participant in this thread
      if (!thread || !thread.participants.some(p => p.id === user.id)) {
        throw new GraphQLError('Thread not found or access denied', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      return thread;
    },
    
    threads: async (_, { first = 10, after }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to view threads', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const { threads, hasNextPage, endCursor, totalCount } = 
        await dataSources.chatAPI.getThreadsByUserId(user.id, { first, after });
      
      return {
        edges: threads.map(thread => ({
          cursor: thread.id,
          node: thread,
        })),
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: threads.length > 0 ? threads[0].id : null,
          endCursor,
        },
        totalCount,
      };
    },
    
    message: async (_, { id }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to view messages', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const message = await dataSources.chatAPI.getMessage(id);
      
      if (!message) {
        throw new GraphQLError('Message not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Get the thread to check if user is a participant
      const thread = await dataSources.chatAPI.getThread(message.threadId);
      
      if (!thread || !thread.participants.some(p => p.id === user.id)) {
        throw new GraphQLError('Access denied for this message', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      return message;
    },
    
    userPresence: async (_, { userId }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to view user presence', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return dataSources.chatAPI.getUserPresence(userId);
    },
  },
  
  Mutation: {
    createThread: async (_, { participants, title, isGroup = false }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to create threads', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Add current user to participants if not already included
      if (!participants.includes(user.id)) {
        participants.push(user.id);
      }
      
      // Validate participants exist
      const users = await Promise.all(
        participants.map(id => dataSources.userAPI.getUserById(id))
      );
      
      if (users.some(u => !u)) {
        throw new GraphQLError('One or more participants do not exist', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      return dataSources.chatAPI.createThread({
        participants,
        title,
        isGroup,
        ownerId: user.id,
      });
    },
    
    addParticipants: async (_, { threadId, userIds }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to modify threads', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const thread = await dataSources.chatAPI.getThread(threadId);
      
      if (!thread) {
        throw new GraphQLError('Thread not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user is the thread owner or admin
      if (thread.ownerId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('Only thread owner can add participants', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Only group threads can have multiple participants
      if (!thread.isGroup && thread.participants.length + userIds.length > 2) {
        throw new GraphQLError('Cannot add participants to a direct message thread', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      return dataSources.chatAPI.addParticipantsToThread(threadId, userIds);
    },
    
    removeParticipants: async (_, { threadId, userIds }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to modify threads', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const thread = await dataSources.chatAPI.getThread(threadId);
      
      if (!thread) {
        throw new GraphQLError('Thread not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user is the thread owner or admin
      if (thread.ownerId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('Only thread owner can remove participants', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Prevent removing the owner from their own thread
      if (userIds.includes(thread.ownerId)) {
        throw new GraphQLError('Cannot remove the thread owner', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      return dataSources.chatAPI.removeParticipantsFromThread(threadId, userIds);
    },
    
    sendMessage: async (_, { threadId, content, attachments }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to send messages', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const thread = await dataSources.chatAPI.getThread(threadId);
      
      if (!thread) {
        throw new GraphQLError('Thread not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user is a participant
      if (!thread.participants.some(p => p.id === user.id)) {
        throw new GraphQLError('You are not a participant in this thread', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Process file attachments if any
      let fileAttachments = [];
      if (attachments && attachments.length > 0) {
        const { processUploadedFile, saveFile } = await import('../../upload/multipart');
        
        fileAttachments = await Promise.all(
          attachments.map(async (attachment) => {
            const processed = await processUploadedFile(attachment);
            const filePath = await saveFile(
              processed, 
              `/chat-attachments/${threadId}/${new Date().getTime()}`
            );
            
            // Create file entry in file system
            const fileEntry = await dataSources.fileSystemAPI.createFile({
              name: processed.filename,
              path: filePath,
              contentType: processed.mimetype,
              size: processed.size,
              ownerId: user.id,
            });
            
            return fileEntry.id;
          })
        );
      }
      
      // Create the message
      const message = await dataSources.chatAPI.createMessage({
        content,
        senderId: user.id,
        threadId,
        attachments: fileAttachments,
        type: attachments && attachments.length > 0 ? 'FILE' : 'TEXT',
      });
      
      // Publish message to all participants for real-time updates
      thread.participants.forEach(participant => {
        if (participant.id !== user.id) {
          dataSources.pubsub.publish(`MESSAGE_RECEIVED:${participant.id}`, {
            messageReceived: message,
          });
        }
      });
      
      return message;
    },
    
    editMessage: async (_, { id, content }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to edit messages', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const message = await dataSources.chatAPI.getMessage(id);
      
      if (!message) {
        throw new GraphQLError('Message not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user is the sender or admin
      if (message.senderId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('You can only edit your own messages', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      return dataSources.chatAPI.updateMessage(id, { 
        content, 
        isEdited: true 
      });
    },
    
    deleteMessage: async (_, { id }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to delete messages', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const message = await dataSources.chatAPI.getMessage(id);
      
      if (!message) {
        throw new GraphQLError('Message not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user is the sender, thread owner, or admin
      const thread = await dataSources.chatAPI.getThread(message.threadId);
      
      if (
        message.senderId !== user.id && 
        thread.ownerId !== user.id && 
        user.role !== 'ADMIN'
      ) {
        throw new GraphQLError('You do not have permission to delete this message', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      await dataSources.chatAPI.deleteMessage(id);
      return true;
    },
    
    markAsRead: async (_, { threadId }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to mark messages as read', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const thread = await dataSources.chatAPI.getThread(threadId);
      
      if (!thread) {
        throw new GraphQLError('Thread not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user is a participant
      if (!thread.participants.some(p => p.id === user.id)) {
        throw new GraphQLError('You are not a participant in this thread', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      await dataSources.chatAPI.markThreadAsRead(threadId, user.id);
      return true;
    },
    
    addReaction: async (_, { messageId, emoji }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to add reactions', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const message = await dataSources.chatAPI.getMessage(messageId);
      
      if (!message) {
        throw new GraphQLError('Message not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user is a participant in the thread
      const thread = await dataSources.chatAPI.getThread(message.threadId);
      
      if (!thread.participants.some(p => p.id === user.id)) {
        throw new GraphQLError('You are not a participant in this thread', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      return dataSources.chatAPI.addReaction(messageId, user.id, emoji);
    },
    
    removeReaction: async (_, { messageId, reactionId }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to remove reactions', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const reaction = await dataSources.chatAPI.getReaction(reactionId);
      
      if (!reaction) {
        throw new GraphQLError('Reaction not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user is the one who added the reaction or admin
      if (reaction.userId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('You can only remove your own reactions', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      await dataSources.chatAPI.removeReaction(reactionId);
      return true;
    },
    
    setPresence: async (_, { status }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to set presence', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const presence = await dataSources.chatAPI.setUserPresence(user.id, status);
      
      // Publish user presence update for subscribers
      dataSources.pubsub.publish('USER_PRESENCE_CHANGED', {
        userPresenceChanged: presence,
      });
      
      return presence;
    },
  },
  
  Subscription: {
    messageReceived: {
      subscribe: (_, { threadId }, { user, dataSources }) => {
        if (!user) {
          throw new GraphQLError('You must be logged in to subscribe to messages', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        // If threadId is provided, filter messages to that thread
        const topic = threadId 
          ? `MESSAGE_RECEIVED:${user.id}:${threadId}`
          : `MESSAGE_RECEIVED:${user.id}`;
        
        return dataSources.pubsub.asyncIterator(topic);
      },
    },
    
    threadUpdated: {
      subscribe: (_, { threadId }, { user, dataSources }) => {
        if (!user) {
          throw new GraphQLError('You must be logged in to subscribe to thread updates', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const topic = threadId 
          ? `THREAD_UPDATED:${threadId}`
          : `THREAD_UPDATED:${user.id}`;
        
        return dataSources.pubsub.asyncIterator(topic);
      },
    },
    
    userPresenceChanged: {
      subscribe: (_, { userId }, { user, dataSources }) => {
        if (!user) {
          throw new GraphQLError('You must be logged in to subscribe to presence updates', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const topic = userId 
          ? `USER_PRESENCE_CHANGED:${userId}`
          : 'USER_PRESENCE_CHANGED';
        
        return dataSources.pubsub.asyncIterator(topic);
      },
    },
  },
  
  ChatThread: {
    messages: async (parent, { first = 10, after, last, before }, { dataSources }) => {
      const { messages, hasNextPage, hasPreviousPage, startCursor, endCursor, totalCount } = 
        await dataSources.chatAPI.getMessagesByThreadId(
          parent.id, 
          { first, after, last, before }
        );
      
      return {
        edges: messages.map(message => ({
          cursor: message.id,
          node: message,
        })),
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor,
          endCursor,
        },
        totalCount,
      };
    },
    
    participants: async (parent, _, { dataSources }) => {
      if (parent.participants) {
        return parent.participants;
      }
      
      return dataSources.chatAPI.getThreadParticipants(parent.id);
    },
    
    unreadCount: async (parent, { userId }, { dataSources }) => {
      return dataSources.chatAPI.getUnreadCount(parent.id, userId);
    },
    
    lastMessage: async (parent, _, { dataSources }) => {
      if (parent.lastMessage) {
        return parent.lastMessage;
      }
      
      return dataSources.chatAPI.getLastMessage(parent.id);
    },
  },
  
  ChatMessage: {
    sender: async (parent, _, { dataSources }) => {
      if (parent.sender) {
        return parent.sender;
      }
      
      return dataSources.userAPI.getUserById(parent.senderId);
    },
    
    thread: async (parent, _, { dataSources }) => {
      if (parent.thread) {
        return parent.thread;
      }
      
      return dataSources.chatAPI.getThread(parent.threadId);
    },
    
    reactions: async (parent, _, { dataSources }) => {
      return dataSources.chatAPI.getReactionsByMessageId(parent.id);
    },
    
    attachments: async (parent, _, { dataSources }) => {
      const attachments = await dataSources.chatAPI.getAttachmentsByMessageId(parent.id);
      
      // Resolve file information for each attachment
      return Promise.all(
        attachments.map(async (attachment) => {
          const file = await dataSources.fileSystemAPI.getFile(attachment.fileId);
          return {
            id: attachment.id,
            file,
            message: parent,
            createdAt: attachment.createdAt,
          };
        })
      );
    },
    
    mentions: async (parent, _, { dataSources }) => {
      const mentionIds = await dataSources.chatAPI.getMentionsByMessageId(parent.id);
      
      if (!mentionIds.length) {
        return [];
      }
      
      return Promise.all(
        mentionIds.map(userId => dataSources.userAPI.getUserById(userId))
      );
    },
    
    readBy: async (parent, _, { dataSources }) => {
      const userIds = await dataSources.chatAPI.getReadByUsers(parent.id);
      
      if (!userIds.length) {
        return [];
      }
      
      return Promise.all(
        userIds.map(userId => dataSources.userAPI.getUserById(userId))
      );
    },
  },
};