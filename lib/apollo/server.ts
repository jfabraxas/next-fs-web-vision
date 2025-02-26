import { ApolloServer } from '@apollo/server';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { GraphQLError } from 'graphql';
import { JWTPayload, jwtVerify } from 'jose';

// Class for adding auth context to subgraph requests
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: any) {
    if (context.user) {
      request.http?.headers.set('user-id', context.user.id);
      request.http?.headers.set('user-role', context.user.role);
    }
  }
}

// List of subgraph services
const serviceList = [
  { name: 'chat', url: process.env.CHAT_SUBGRAPH_URL || 'http://localhost:4001/graphql' },
  { name: 'files', url: process.env.FILES_SUBGRAPH_URL || 'http://localhost:4002/graphql' },
  { name: 'knowledge', url: process.env.KNOWLEDGE_SUBGRAPH_URL || 'http://localhost:4003/graphql' },
  { name: 'settings', url: process.env.SETTINGS_SUBGRAPH_URL || 'http://localhost:4004/graphql' },
];

// Setup Apollo Gateway
const gateway = new ApolloGateway({
  serviceList,
  buildService({ url }) {
    return new AuthenticatedDataSource({ url });
  },
});

// Create Apollo Server
const server = new ApolloServer({
  gateway,
  plugins: [
    // Logging plugin
    {
      async serverWillStart() {
        console.log('Starting Apollo Gateway server...');
        return {
          async drainServer() {
            console.log('Shutting down Apollo Gateway server...');
          },
        };
      },
      async requestDidStart() {
        return {
          async didEncounterErrors({ errors }) {
            console.error('GraphQL errors:', errors);
          },
        };
      },
    },
  ],
});

// Verify auth token
async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'this-is-a-dev-secret-key');
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    throw new GraphQLError('Invalid token', {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
  }
}

// Create Next.js API handler
export const apolloHandler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
    // Get auth token from request headers
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null };
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = await verifyToken(token);
      
      return {
        user: {
          id: payload.sub,
          role: payload.role,
          email: payload.email,
        },
      };
    } catch (error) {
      return { user: null };
    }
  },
});