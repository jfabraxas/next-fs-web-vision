import { GraphQLError } from 'graphql';

export const settingsResolvers = {
  Query: {
    settings: async (_, __, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to access settings', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return dataSources.settingsAPI.getUserSettings(user.id);
    },
    
    aiModel: async (_, { id }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to access models', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const model = await dataSources.settingsAPI.getModelById(id);
      
      if (!model) {
        throw new GraphQLError('AI model not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      return model;
    },
    
    aiModels: async (_, { type }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to access models', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return dataSources.settingsAPI.getModels(type);
    },
  },
  
  Mutation: {
    updateSettings: async (_, { 
      theme, 
      fontSize, 
      language, 
      notifications 
    }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to update settings', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Get current settings
      const currentSettings = await dataSources.settingsAPI.getUserSettings(user.id);
      
      // Prepare updates
      const updates: any = {};
      
      if (theme) updates.theme = theme;
      if (fontSize) updates.fontSize = fontSize;
      if (language) updates.language = language;
      
      if (notifications) {
        updates.notifications = {
          ...currentSettings.notifications,
          ...notifications,
        };
      }
      
      // Update settings
      return dataSources.settingsAPI.updateUserSettings(user.id, updates);
    },
    
    updateModelSettings: async (_, { 
      modelId, 
      isEnabled, 
      isDefault, 
      contextLength 
    }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to update model settings', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Only admins can update model settings
      if (user.role !== 'ADMIN') {
        throw new GraphQLError('Only administrators can update model settings', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      const model = await dataSources.settingsAPI.getModelById(modelId);
      
      if (!model) {
        throw new GraphQLError('AI model not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Prepare updates
      const updates: any = {};
      
      if (isEnabled !== undefined) updates.isEnabled = isEnabled;
      if (contextLength !== undefined) updates.contextLength = contextLength;
      
      // If setting as default, update all other models of same type
      if (isDefault) {
        // First update all other models of same type to not be default
        await dataSources.settingsAPI.unsetDefaultModels(model.type);
        updates.isDefault = true;
      }
      
      // Update model
      return dataSources.settingsAPI.updateModel(modelId, updates);
    },
  },
  
  Settings: {
    user: async (parent, _, { dataSources }) => {
      if (parent.user) {
        return parent.user;
      }
      
      return dataSources.userAPI.getUserById(parent.userId);
    },
    
    modelPreferences: async (parent, _, { dataSources }) => {
      if (parent.modelPreferences) {
        return parent.modelPreferences;
      }
      
      return dataSources.settingsAPI.getUserModelPreferences(parent.userId);
    },
  },
  
  ModelPreferences: {
    defaultTextModel: async (parent, _, { dataSources }) => {
      if (!parent.defaultTextModelId) {
        // Get the global default model
        return dataSources.settingsAPI.getDefaultModel('TEXT');
      }
      
      return dataSources.settingsAPI.getModelById(parent.defaultTextModelId);
    },
    
    defaultVisionModel: async (parent, _, { dataSources }) => {
      if (!parent.defaultVisionModelId) {
        // Get the global default model
        return dataSources.settingsAPI.getDefaultModel('VISION');
      }
      
      return dataSources.settingsAPI.getModelById(parent.defaultVisionModelId);
    },
  },
};