import { GraphQLError } from 'graphql';

export const searchResolvers = {
  Query: {
    search: async (_, { input }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to search', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const { 
        query, 
        filters, 
        facets, 
        first = 20, 
        after, 
        sources = ['CHAT', 'FILE_SYSTEM', 'KNOWLEDGE_BASE']
      } = input;
      
      // Perform search across all sources specified
      try {
        const { 
          results, 
          facets: resultFacets, 
          hasNextPage, 
          endCursor, 
          totalCount 
        } = await dataSources.searchAPI.search({
          query, 
          filters, 
          facets, 
          first, 
          after, 
          sources,
          userId: user.id,
          role: user.role,
        });
        
        return {
          edges: results.map(result => ({
            cursor: result.id,
            node: result,
          })),
          pageInfo: {
            hasNextPage,
            hasPreviousPage: !!after,
            startCursor: results.length > 0 ? results[0].id : null,
            endCursor,
          },
          totalCount,
          facets: resultFacets,
        };
      } catch (error) {
        console.error('Search error:', error);
        throw new GraphQLError(
          error instanceof Error ? error.message : 'Failed to perform search',
          {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          }
        );
      }
    },
  },
  
  SearchResult: {
    __resolveReference: async ({ id }, { dataSources }) => {
      // This resolver handles federated references to search results
      const [type, actualId] = id.split(':');
      
      switch (type) {
        case 'chat':
          const message = await dataSources.chatAPI.getMessage(actualId);
          return {
            id,
            type: 'MESSAGE',
            title: `Message from ${message.sender.name || 'Unknown'}`,
            description: message.content.substring(0, 100),
            preview: message.content.substring(0, 200),
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            url: `/chat?thread=${message.threadId}&message=${actualId}`,
            score: 1,
            source: 'CHAT',
          };
          
        case 'file':
          const file = await dataSources.fileSystemAPI.getFileById(actualId);
          return {
            id,
            type: 'FILE',
            title: file.name,
            description: `${file.type} - ${file.size} bytes`,
            preview: null,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            url: `/storage?path=${encodeURIComponent(file.path)}`,
            score: 1,
            source: 'FILE_SYSTEM',
          };
          
        case 'knowledge':
          const item = await dataSources.knowledgeAPI.getItemById(actualId);
          return {
            id,
            type: 'KNOWLEDGE',
            title: item.name,
            description: item.description,
            preview: item.content ? item.content.substring(0, 300) : null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            url: `/knowledge/${actualId}`,
            score: 1,
            category: item.category,
            source: 'KNOWLEDGE_BASE',
          };
          
        default:
          return null;
      }
    },
  },
};