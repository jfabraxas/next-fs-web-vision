'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { create as createOrama, insert, search, Orama } from '@orama/orama';
import { FileSystemEntry, KnowledgeBase, ChatMessage } from '@/lib/types';

// Define the schemas for different types of content
const fileSystemSchema = {
  name: 'string',
  path: 'string',
  type: 'string',
  content: 'string', // For searchable content
};

const knowledgeBaseSchema = {
  id: 'string',
  name: 'string',
  description: 'string',
  content: 'string', // For searchable content
  category: 'string', // Category of knowledge item
  tags: 'string[]', // For search by tags
};

const chatMessageSchema = {
  id: 'string',
  content: 'string',
  role: 'string',
};

interface SearchState {
  fileSystemIndex: Orama | null;
  knowledgeBaseIndex: Orama | null;
  chatMessageIndex: Orama | null;
  isInitialized: boolean;
  initializeSearch: () => Promise<void>;
  indexFileSystem: (entries: FileSystemEntry[]) => Promise<void>;
  indexKnowledgeBase: (items: KnowledgeBase[]) => Promise<void>;
  indexChatMessages: (messages: ChatMessage[]) => Promise<void>;
  searchAll: (query: string) => Promise<{
    files: any[];
    knowledge: any[];
    messages: any[];
  }>;
  searchFiles: (query: string) => Promise<any[]>;
  searchKnowledge: (query: string) => Promise<any[]>;
  searchMessages: (query: string) => Promise<any[]>;
}

export const useSearchStore = create<SearchState>()(
  (set, get) => ({
    fileSystemIndex: null,
    knowledgeBaseIndex: null,
    chatMessageIndex: null,
    isInitialized: false,

    initializeSearch: async () => {
      try {
        // Create the Orama indexes for different content types
        const fileSystemIndex = await createOrama({
          schema: fileSystemSchema,
        });

        const knowledgeBaseIndex = await createOrama({
          schema: knowledgeBaseSchema,
        });

        const chatMessageIndex = await createOrama({
          schema: chatMessageSchema,
        });

        set({ 
          fileSystemIndex, 
          knowledgeBaseIndex, 
          chatMessageIndex,
          isInitialized: true 
        });
        
      } catch (error) {
        console.error('Failed to initialize search indexes:', error);
        throw error;
      }
    },

    indexFileSystem: async (entries: FileSystemEntry[]) => {
      const { fileSystemIndex, isInitialized, initializeSearch } = get();
      
      if (!isInitialized) {
        await initializeSearch();
      }
      
      if (!fileSystemIndex) return;
      
      try {
        for (const entry of entries) {
          if (entry.type === 'file') {
            await insert(fileSystemIndex, {
              name: entry.name,
              path: entry.path,
              type: entry.type,
              content: entry.name, // In a real app, we'd extract content from the file
            });
          }
        }
      } catch (error) {
        console.error('Failed to index file system entries:', error);
      }
    },

    indexKnowledgeBase: async (items: KnowledgeBase[]) => {
      const { knowledgeBaseIndex, isInitialized, initializeSearch } = get();
      
      if (!isInitialized) {
        await initializeSearch();
      }
      
      if (!knowledgeBaseIndex) return;
      
      try {
        for (const item of items) {
          await insert(knowledgeBaseIndex, {
            id: item.id,
            name: item.name,
            description: item.description,
            content: `${item.name} ${item.description}`, // Combined searchable content
            category: 'document', // Default category, would be dynamic in a real app
            tags: [], // Tags would be populated in a real app
          });
        }
      } catch (error) {
        console.error('Failed to index knowledge base items:', error);
      }
    },

    indexChatMessages: async (messages: ChatMessage[]) => {
      const { chatMessageIndex, isInitialized, initializeSearch } = get();
      
      if (!isInitialized) {
        await initializeSearch();
      }
      
      if (!chatMessageIndex) return;
      
      try {
        for (const message of messages) {
          await insert(chatMessageIndex, {
            id: message.id,
            content: message.content,
            role: message.role,
          });
        }
      } catch (error) {
        console.error('Failed to index chat messages:', error);
      }
    },

    searchAll: async (query: string) => {
      const { searchFiles, searchKnowledge, searchMessages } = get();
      
      const [files, knowledge, messages] = await Promise.all([
        searchFiles(query),
        searchKnowledge(query),
        searchMessages(query),
      ]);
      
      return { files, knowledge, messages };
    },

    searchFiles: async (query: string) => {
      const { fileSystemIndex, isInitialized, initializeSearch } = get();
      
      if (!isInitialized) {
        await initializeSearch();
      }
      
      if (!fileSystemIndex) return [];
      
      try {
        const results = await search(fileSystemIndex, {
          term: query,
        });
        
        return results.hits;
      } catch (error) {
        console.error('Failed to search files:', error);
        return [];
      }
    },

    searchKnowledge: async (query: string) => {
      const { knowledgeBaseIndex, isInitialized, initializeSearch } = get();
      
      if (!isInitialized) {
        await initializeSearch();
      }
      
      if (!knowledgeBaseIndex) return [];
      
      try {
        const results = await search(knowledgeBaseIndex, {
          term: query,
        });
        
        return results.hits;
      } catch (error) {
        console.error('Failed to search knowledge base:', error);
        return [];
      }
    },

    searchMessages: async (query: string) => {
      const { chatMessageIndex, isInitialized, initializeSearch } = get();
      
      if (!isInitialized) {
        await initializeSearch();
      }
      
      if (!chatMessageIndex) return [];
      
      try {
        const results = await search(chatMessageIndex, {
          term: query,
        });
        
        return results.hits;
      } catch (error) {
        console.error('Failed to search chat messages:', error);
        return [];
      }
    },
  })
);