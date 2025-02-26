'use client';

import { useState, useEffect } from 'react';
import { createClient, Provider, fetchExchange, subscriptionExchange } from 'urql';
import { authExchange } from '@urql/exchange-auth';
import { refocusExchange } from '@urql/exchange-refocus';
import { retryExchange } from '@urql/exchange-retry';
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch';
import { cacheExchange } from '@urql/exchange-graphcache';
import { createClient as createWSClient } from 'graphql-ws';

type AuthState = {
  token: string | null;
};

export function URQLProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // WebSocket client for subscriptions
    const wsClient = typeof window !== 'undefined' 
      ? createWSClient({
          url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URI || 'ws://localhost:4000/graphql',
          connectionParams: () => {
            const token = localStorage.getItem('authToken');
            return { 
              authorization: token ? `Bearer ${token}` : '' 
            };
          },
        })
      : null;

    // URQL client
    const urqlClient = createClient({
      url: process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URI || '/api/graphql',
      exchanges: [
        refocusExchange(),
        // Auth exchange for token management
        authExchange<AuthState>({
          getAuth: async ({ authState }) => {
            if (!authState) {
              const token = localStorage.getItem('authToken');
              if (token) {
                return { token };
              }
              return { token: null };
            }
            return null;
          },
          addAuthToOperation: ({ authState, operation }) => {
            if (!authState?.token) return operation;
            
            const fetchOptions = typeof operation.context.fetchOptions === 'function'
              ? operation.context.fetchOptions()
              : operation.context.fetchOptions || {};
              
            return {
              ...operation,
              context: {
                ...operation.context,
                fetchOptions: {
                  ...fetchOptions,
                  headers: {
                    ...fetchOptions.headers,
                    Authorization: `Bearer ${authState.token}`,
                  },
                },
              },
            };
          },
          didAuthError: ({ error }) => {
            return error.graphQLErrors.some(
              e => e.extensions?.code === 'UNAUTHENTICATED',
            );
          },
          willAuthError: ({ authState }) => {
            return !authState?.token;
          },
        }),
        // Cache exchange
        cacheExchange({
          keys: {
            UserConnection: () => null,
            MessageConnection: () => null,
            FileConnection: () => null,
          },
        }),
        // Retry exchange for handling retry logic
        retryExchange({
          initialDelayMs: 1000,
          maxDelayMs: 5000,
          randomDelay: true,
          maxNumberAttempts: 3,
          retryIf: (err) => !!(err && err.networkError),
        }),
        // Multipart fetch exchange for file uploads
        multipartFetchExchange,
        // Regular fetch exchange as fallback
        fetchExchange,
        // Subscription exchange
        wsClient 
          ? subscriptionExchange({
              forwardSubscription: (operation) => ({
                subscribe: (sink) => {
                  const dispose = wsClient.subscribe(operation, sink);
                  return {
                    unsubscribe: dispose,
                  };
                },
              }),
            })
          : fetchExchange,
      ],
    });

    setClient(urqlClient);
  }, []);

  if (!client) {
    return null;
  }

  return <Provider value={client}>{children}</Provider>;
}