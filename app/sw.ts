import { defaultCache } from '@serwist/next/browser';
import type { PrecacheEntry } from '@serwist/precaching';
import { installSerwist } from '@serwist/sw';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

// Install Serwist service worker
installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// GraphQL client for service worker
let graphqlClient = {
  async executeOperation(operation: any) {
    try {
      const { query, variables, context } = operation;
      
      // Prepare headers
      const headers = new Headers({
        'Content-Type': 'application/json',
      });
      
      // Add authorization if present
      if (context?.headers?.authorization) {
        headers.append('Authorization', context.headers.authorization);
      }
      
      // Check if we can respond from cache
      const cacheKey = `graphql:${JSON.stringify({ query, variables })}`;
      const cache = await caches.open('graphql-cache');
      const cachedResponse = await cache.match(cacheKey);
      
      if (cachedResponse) {
        const { data, errors } = await cachedResponse.json();
        
        // Only use cache if there are no errors
        if (!errors) {
          return { data, errors: null };
        }
      }
      
      // If not in cache or has errors, fetch from API
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Cache successful results
      if (result.data && !result.errors) {
        await cache.put(
          cacheKey,
          new Response(JSON.stringify(result), {
            headers: new Headers({
              'Content-Type': 'application/json',
            }),
          })
        );
      }
      
      return result;
    } catch (error) {
      console.error('GraphQL operation error in service worker:', error);
      return {
        data: null,
        errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
      };
    }
  }
};

// Set up message handling for GraphQL operations
self.addEventListener('message', async (event) => {
  if (!event.data || event.data.type !== 'graphql') return;
  
  const { id, operation } = event.data;
  const port = event.ports[0];
  
  try {
    // Execute GraphQL operation
    const result = await graphqlClient.executeOperation(operation);
    
    // Send response back
    if (result.errors) {
      port.postMessage({ type: 'error', error: result.errors, id });
    } else {
      port.postMessage({ type: 'next', data: result, id });
      port.postMessage({ type: 'complete', id });
    }
  } catch (error) {
    port.postMessage({ 
      type: 'error', 
      error: { message: error instanceof Error ? error.message : 'Unknown error' }, 
      id 
    });
  }
});