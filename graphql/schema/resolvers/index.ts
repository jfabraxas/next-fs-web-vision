import { DateTimeResolver, JSONResolver, DateResolver } from 'graphql-scalars';
import { GraphQLUpload } from 'graphql-upload-minimal';
import { userResolvers } from './user';
import { chatResolvers } from './chat';
import { fileSystemResolvers } from './fileSystem';
import { knowledgeResolvers } from './knowledge';
import { searchResolvers } from './search';
import { settingsResolvers } from './settings';
import { webRTCResolvers } from './webrtc';
import { storageResolvers } from './storage';

// Merge all resolvers
const resolvers = {
  // Custom scalars
  Upload: GraphQLUpload,
  DateTime: DateTimeResolver,
  Date: DateResolver,
  JSON: JSONResolver,
  
  // Interface resolvers
  Node: {
    __resolveType(obj: any) {
      // Resolve the type for the Node interface based on the object properties
      if (obj.content && obj.thread) return 'ChatMessage';
      if (obj.path && obj.type) return 'FileSystemEntry';
      if (obj.category && obj.visibility) return 'KnowledgeItem';
      if (obj.notifications) return 'Settings';
      if (obj.parameters) return 'AIModel';
      if (obj.email) return 'User';
      if (obj.participants && obj.isActive !== undefined) return 'RTCSession';
      if (obj.status && obj.destination) return 'BackupJob';
      return null;
    }
  },
  
  // Query and Mutation root resolvers will be merged from the domain-specific resolvers
  Query: {
    node: async (_, { id }, context) => {
      // Resolve node by ID across all domains
      const [type, actualId] = id.split(':');
      
      switch (type) {
        case 'user':
          return { ...await context.dataSources.userAPI.getUserById(actualId), __typename: 'User' };
        case 'message':
          return { ...await context.dataSources.chatAPI.getMessage(actualId), __typename: 'ChatMessage' };
        case 'thread':
          return { ...await context.dataSources.chatAPI.getThread(actualId), __typename: 'ChatThread' };
        case 'file':
          return { ...await context.dataSources.fileSystemAPI.getFile(actualId), __typename: 'FileSystemEntry' };
        case 'knowledge':
          return { ...await context.dataSources.knowledgeAPI.getItem(actualId), __typename: 'KnowledgeItem' };
        case 'model':
          return { ...await context.dataSources.settingsAPI.getModel(actualId), __typename: 'AIModel' };
        default:
          return null;
      }
    },
    ...userResolvers.Query,
    ...chatResolvers.Query,
    ...fileSystemResolvers.Query,
    ...knowledgeResolvers.Query,
    ...searchResolvers.Query,
    ...settingsResolvers.Query,
    ...storageResolvers.Query,
  },
  
  Mutation: {
    ...userResolvers.Mutation,
    ...chatResolvers.Mutation,
    ...fileSystemResolvers.Mutation,
    ...knowledgeResolvers.Mutation,
    ...settingsResolvers.Mutation,
    ...webRTCResolvers.Mutation,
    ...storageResolvers.Mutation,
  },
  
  Subscription: {
    ...chatResolvers.Subscription,
    ...fileSystemResolvers.Subscription,
    ...knowledgeResolvers.Subscription,
    ...webRTCResolvers.Subscription,
  },
};

// Export merged resolvers
export default resolvers;