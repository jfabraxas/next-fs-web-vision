import { GraphQLError } from 'graphql';
import { sign } from 'jose';

// User resolver implementation
export const userResolvers = {
  Query: {
    me: async (_, __, { user, dataSources }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to view this information', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return dataSources.userAPI.getUserById(user.id);
    },
    
    user: async (_, { id }, { dataSources, user }) => {
      // Check authentication
      if (!user) {
        throw new GraphQLError('You must be logged in to view user information', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return dataSources.userAPI.getUserById(id);
    },
    
    users: async (_, { first = 10, after, filter }, { dataSources, user }) => {
      // Check authentication and authorization
      if (!user) {
        throw new GraphQLError('You must be logged in to view users', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Only admins can list all users
      if (user.role !== 'ADMIN') {
        throw new GraphQLError('Insufficient permissions to list all users', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      const { users, hasNextPage, endCursor, totalCount } = 
        await dataSources.userAPI.getUsers({ first, after, filter });
      
      return {
        edges: users.map(user => ({
          cursor: user.id,
          node: user,
        })),
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: users.length > 0 ? users[0].id : null,
          endCursor,
        },
        totalCount,
      };
    },
  },
  
  Mutation: {
    login: async (_, { email, password }, { dataSources }) => {
      try {
        const user = await dataSources.userAPI.authenticateUser(email, password);
        
        if (!user) {
          throw new GraphQLError('Invalid email or password', {
            extensions: { code: 'UNAUTHORIZED' },
          });
        }
        
        // Create JWT token with user information
        const tokenData = {
          sub: user.id,
          email: user.email,
          role: user.role,
        };
        
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || 'this-is-a-dev-secret-key'
        );
        
        // Set expiration to 7 days
        const expiresIn = 60 * 60 * 24 * 7;
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
        
        const token = await sign(tokenData, secret, {
          expiresIn,
          algorithm: 'HS256',
        });
        
        return {
          token,
          user,
          expiresAt,
        };
      } catch (error) {
        console.error('Login error:', error);
        
        throw new GraphQLError(
          error instanceof Error ? error.message : 'Authentication failed',
          {
            extensions: { code: 'UNAUTHORIZED' },
          }
        );
      }
    },
    
    register: async (_, { email, password, name }, { dataSources }) => {
      try {
        // Check if user already exists
        const existingUser = await dataSources.userAPI.getUserByEmail(email);
        
        if (existingUser) {
          throw new GraphQLError('User with this email already exists', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        
        // Create new user
        const user = await dataSources.userAPI.createUser({
          email,
          password,
          name,
          role: 'USER', // Default role for new users
        });
        
        // Create JWT token with user information
        const tokenData = {
          sub: user.id,
          email: user.email,
          role: user.role,
        };
        
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || 'this-is-a-dev-secret-key'
        );
        
        // Set expiration to 7 days
        const expiresIn = 60 * 60 * 24 * 7;
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
        
        const token = await sign(tokenData, secret, {
          expiresIn,
          algorithm: 'HS256',
        });
        
        return {
          token,
          user,
          expiresAt,
        };
      } catch (error) {
        console.error('Registration error:', error);
        
        throw new GraphQLError(
          error instanceof Error ? error.message : 'Registration failed',
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }
    },
    
    updateProfile: async (_, { name, avatar }, { user, dataSources }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to update your profile', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Process avatar upload if provided
      let avatarUrl = undefined;
      if (avatar) {
        const { processUploadedFile, saveFile } = await import('../../upload/multipart');
        const processed = await processUploadedFile(avatar);
        avatarUrl = await saveFile(processed, `/avatars/${user.id}`);
      }
      
      // Update user profile
      return dataSources.userAPI.updateUser(user.id, {
        name,
        avatar: avatarUrl,
      });
    },
  },
  
  User: {
    threads: async (parent, { first = 10, after }, { dataSources }) => {
      const { threads, hasNextPage, endCursor, totalCount } = 
        await dataSources.chatAPI.getThreadsByUserId(parent.id, { first, after });
      
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
    
    files: async (parent, { first = 10, after }, { dataSources }) => {
      const { entries, hasNextPage, endCursor, totalCount } = 
        await dataSources.fileSystemAPI.getFilesByUserId(parent.id, { first, after });
      
      return {
        edges: entries.map(entry => ({
          cursor: entry.id,
          node: entry,
        })),
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: entries.length > 0 ? entries[0].id : null,
          endCursor,
        },
        totalCount,
      };
    },
    
    knowledgeItems: async (parent, { first = 10, after }, { dataSources }) => {
      const { items, hasNextPage, endCursor, totalCount } = 
        await dataSources.knowledgeAPI.getItemsByUserId(parent.id, { first, after });
      
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
    
    settings: async (parent, _, { dataSources }) => {
      return dataSources.settingsAPI.getUserSettings(parent.id);
    },
    
    status: async (parent, _, { dataSources }) => {
      const presence = await dataSources.chatAPI.getUserPresence(parent.id);
      return presence?.status || 'OFFLINE';
    },
  },
};