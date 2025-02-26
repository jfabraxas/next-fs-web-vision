import { GraphQLError } from 'graphql';

export const knowledgeResolvers = {
  Query: {
    knowledgeItem: async (_, { id }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to access knowledge base', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const item = await dataSources.knowledgeAPI.getItemById(id);
      
      if (!item) {
        throw new GraphQLError('Knowledge item not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user has access to this item
      if (
        item.visibility === 'PRIVATE' && 
        item.createdBy !== user.id && 
        user.role !== 'ADMIN'
      ) {
        throw new GraphQLError('Access denied to this knowledge item', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      return item;
    },
    
    knowledgeItems: async (_, { category, tags, first = 20, after }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to access knowledge base', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const { items, hasNextPage, endCursor, totalCount } = await dataSources.knowledgeAPI.getItems({
        category,
        tags,
        first,
        after,
        userId: user.id,
        role: user.role,
      });
      
      return {
        edges: items.map(item => ({
          cursor: item.id,
          node: item,
        })),
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: items.length > 0 ? items[0].id : null,
          endCursor,
        },
        totalCount,
      };
    },
  },
  
  Mutation: {
    createKnowledgeItem: async (_, { 
      name, 
      description, 
      content, 
      category, 
      tags, 
      files, 
      visibility 
    }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to create knowledge items', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Validate files
      if (files && files.length > 0) {
        await Promise.all(files.map(async (fileId) => {
          const file = await dataSources.fileSystemAPI.getFileById(fileId);
          
          if (!file) {
            throw new GraphQLError(`File with ID ${fileId} not found`, {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          
          // Check if user has access to the file
          const hasAccess = await dataSources.fileSystemAPI.checkUserAccess(
            fileId, 
            user.id, 
            'READ'
          );
          
          if (!hasAccess && file.ownerId !== user.id && user.role !== 'ADMIN') {
            throw new GraphQLError(`You do not have permission to use file with ID ${fileId}`, {
              extensions: { code: 'FORBIDDEN' },
            });
          }
        }));
      }
      
      // Create the knowledge item
      const item = await dataSources.knowledgeAPI.createItem({
        name,
        description,
        content,
        category,
        tags: tags || [],
        files: files || [],
        visibility,
        createdBy: user.id,
      });
      
      // Index the knowledge item for search
      await dataSources.searchAPI.indexKnowledgeItem(item);
      
      return item;
    },
    
    updateKnowledgeItem: async (_, { 
      id, 
      name, 
      description, 
      content, 
      category, 
      tags, 
      files, 
      visibility 
    }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to update knowledge items', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const item = await dataSources.knowledgeAPI.getItemById(id);
      
      if (!item) {
        throw new GraphQLError('Knowledge item not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user is the creator or admin
      if (item.createdBy !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('You do not have permission to update this knowledge item', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Validate files if provided
      if (files && files.length > 0) {
        await Promise.all(files.map(async (fileId) => {
          const file = await dataSources.fileSystemAPI.getFileById(fileId);
          
          if (!file) {
            throw new GraphQLError(`File with ID ${fileId} not found`, {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          
          // Check if user has access to the file
          const hasAccess = await dataSources.fileSystemAPI.checkUserAccess(
            fileId, 
            user.id, 
            'READ'
          );
          
          if (!hasAccess && file.ownerId !== user.id && user.role !== 'ADMIN') {
            throw new GraphQLError(`You do not have permission to use file with ID ${fileId}`, {
              extensions: { code: 'FORBIDDEN' },
            });
          }
        }));
      }
      
      // Update the knowledge item
      const updatedItem = await dataSources.knowledgeAPI.updateItem(id, {
        name,
        description,
        content,
        category,
        tags,
        files,
        visibility,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
      
      // Re-index the knowledge item for search
      await dataSources.searchAPI.updateKnowledgeItemIndex(updatedItem);
      
      // Publish knowledge item update
      dataSources.pubsub.publish(`KNOWLEDGE_ITEM_UPDATED:${id}`, {
        knowledgeItemUpdated: updatedItem,
      });
      
      return updatedItem;
    },
    
    deleteKnowledgeItem: async (_, { id }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to delete knowledge items', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const item = await dataSources.knowledgeAPI.getItemById(id);
      
      if (!item) {
        throw new GraphQLError('Knowledge item not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user is the creator or admin
      if (item.createdBy !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('You do not have permission to delete this knowledge item', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Delete the knowledge item
      await dataSources.knowledgeAPI.deleteItem(id);
      
      // Remove from search index
      await dataSources.searchAPI.removeKnowledgeItemFromIndex(id);
      
      // Publish knowledge item update with deleted flag
      dataSources.pubsub.publish(`KNOWLEDGE_ITEM_UPDATED:${id}`, {
        knowledgeItemUpdated: {
          ...item,
          deleted: true,
        },
      });
      
      return true;
    },
  },
  
  Subscription: {
    knowledgeItemUpdated: {
      subscribe: (_, { id }, { user, dataSources }) => {
        if (!user) {
          throw new GraphQLError('You must be logged in to subscribe to knowledge updates', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const topic = id 
          ? `KNOWLEDGE_ITEM_UPDATED:${id}`
          : `KNOWLEDGE_ITEM_UPDATED:${user.id}`;
        
        return dataSources.pubsub.asyncIterator(topic);
      },
    },
  },
  
  KnowledgeItem: {
    createdBy: async (parent, _, { dataSources }) => {
      if (parent.creator) {
        return parent.creator;
      }
      
      return dataSources.userAPI.getUserById(parent.createdBy);
    },
    
    updatedBy: async (parent, _, { dataSources }) => {
      if (!parent.updatedBy) {
        return null;
      }
      
      if (parent.updater) {
        return parent.updater;
      }
      
      return dataSources.userAPI.getUserById(parent.updatedBy);
    },
    
    files: async (parent, _, { dataSources }) => {
      if (!parent.files || parent.files.length === 0) {
        return [];
      }
      
      return Promise.all(
        parent.files.map(fileId => dataSources.fileSystemAPI.getFileById(fileId))
      );
    },
    
    relatedItems: async (parent, _, { dataSources }) => {
      return dataSources.knowledgeAPI.getRelatedItems(parent.id);
    },
  },
};