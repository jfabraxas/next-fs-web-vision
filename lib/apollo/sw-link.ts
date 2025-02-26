'use client';

import { ApolloLink, Operation, FetchResult, Observable } from '@apollo/client';

// Service Worker GraphQL link
// This link intercepts GraphQL operations and forwards them to the service worker
export class ServiceWorkerLink extends ApolloLink {
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    super();
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      this.setupServiceWorker();
    }
  }

  private async setupServiceWorker() {
    try {
      // Wait for the service worker to be ready
      this.swRegistration = await navigator.serviceWorker.ready;
      console.log('ServiceWorkerLink: Connected to service worker');
    } catch (error) {
      console.error('ServiceWorkerLink: Failed to connect to service worker', error);
    }
  }

  request(operation: Operation): Observable<FetchResult> {
    return new Observable((observer) => {
      const messageChannel = new MessageChannel();
      const operationId = Math.random().toString(36).substring(2, 15);

      // Set up response handler
      messageChannel.port1.onmessage = (event) => {
        const response = event.data;

        if (response.type === 'error') {
          observer.error(response.error);
          messageChannel.port1.close();
          return;
        }

        if (response.type === 'next') {
          observer.next(response.data);
        }

        if (response.type === 'complete') {
          observer.complete();
          messageChannel.port1.close();
        }
      };

      // Send the operation to the service worker
      if (this.swRegistration?.active) {
        this.swRegistration.active.postMessage({
          type: 'graphql',
          id: operationId,
          operation: {
            query: operation.query.loc?.source.body,
            variables: operation.variables,
            operationName: operation.operationName,
            context: {
              headers: operation.getContext().headers,
            },
          },
        }, [messageChannel.port2]);
      } else {
        // Fallback if service worker is not available
        observer.error(new Error('ServiceWorkerLink: Service worker not available'));
        observer.complete();
      }

      // Cleanup function
      return () => {
        messageChannel.port1.close();
      };
    });
  }
}