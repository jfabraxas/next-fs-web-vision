'use client';

import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, from, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { useEffect, useState } from 'react';

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Auth link to add authorization headers
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<ApolloClient<any> | null>(null);

  useEffect(() => {
    // HTTP link
    const httpLink = new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URI || '/api/graphql',
    });

    // WebSocket link for subscriptions
    const wsLink = typeof window !== 'undefined' 
      ? new GraphQLWsLink(
          createClient({
            url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URI || 'ws://localhost:4000/graphql',
            connectionParams: () => {
              const token = localStorage.getItem('authToken');
              return { 
                authorization: token ? `Bearer ${token}` : '' 
              };
            },
          })
        ) 
      : null;

    // Split between HTTP and WS links based on operation type
    const splitLink = wsLink 
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === 'OperationDefinition' &&
              definition.operation === 'subscription'
            );
          },
          wsLink,
          httpLink
        ) 
      : httpLink;

    // Create the Apollo Client
    const client = new ApolloClient({
      link: from([errorLink, authLink, splitLink]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network',
        },
      },
      connectToDevTools: process.env.NODE_ENV === 'development',
    });

    setClient(client);
  }, []);

  if (!client) {
    return null;
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}