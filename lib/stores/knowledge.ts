'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeBase, KnowledgeItemCategory } from '@/lib/types';
import { useSearchStore } from './search';

interface CreateKnowledgeItem {
  name: string;
  description: string;
  category?: KnowledgeItemCategory;
  tags?: string[];
  files: string[];
}

interface KnowledgeState {
  items: KnowledgeBase[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (item: CreateKnowledgeItem) => Promise<KnowledgeBase>;
  updateItem: (id: string, item: Partial<KnowledgeBase>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItemById: (id: string) => KnowledgeBase | undefined;
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchItems: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real implementation, this would fetch from an API or database
          // Here we're just simulating a delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // If there are no items yet, let's add some mock data for demonstration
          const state = get();
          if (state.items.length === 0) {
            const mockItems: KnowledgeBase[] = [
              {
                id: uuidv4(),
                name: 'Project Documentation',
                description: 'Technical documentation for the current project including architecture diagrams and API specs.',
                files: ['architecture.pdf', 'api-specs.md'],
                createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
                category: 'document',
                tags: ['technical', 'documentation', 'architecture'],
              },
              {
                id: uuidv4(),
                name: 'React Best Practices',
                description: 'Collection of React best practices and patterns for modern web development.',
                files: ['react-patterns.md', 'code-samples.jsx'],
                createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
                category: 'code',
                tags: ['react', 'javascript', 'frontend'],
              },
              {
                id: uuidv4(),
                name: 'UI Design System',
                description: 'Design system components and guidelines for consistent UI development.',
                files: ['design-system.sketch', 'color-palette.png'],
                createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
                category: 'image',
                tags: ['design', 'ui', 'components'],
              },
            ];
            
            set({ items: mockItems });
            
            // Index the mock items in the search store
            const { indexKnowledgeBase } = useSearchStore.getState();
            await indexKnowledgeBase(mockItems);
          }
        } catch (error) {
          console.error('Failed to fetch knowledge items:', error);
          set({ error: 'Failed to load knowledge items. Please try again later.' });
        } finally {
          set({ isLoading: false });
        }
      },

      createItem: async (itemData: CreateKnowledgeItem) => {
        try {
          const timestamp = Date.now();
          const newItem: KnowledgeBase = {
            id: uuidv4(),
            name: itemData.name,
            description: itemData.description,
            files: itemData.files || [],
            createdAt: timestamp,
            updatedAt: timestamp,
            category: itemData.category || 'document',
            tags: itemData.tags || [],
          };
          
          set(state => ({ 
            items: [...state.items, newItem]
          }));
          
          // Index the new item in the search store
          const { indexKnowledgeBase } = useSearchStore.getState();
          await indexKnowledgeBase([newItem]);
          
          return newItem;
        } catch (error) {
          console.error('Failed to create knowledge item:', error);
          throw error;
        }
      },

      updateItem: async (id: string, itemData: Partial<KnowledgeBase>) => {
        try {
          set(state => {
            const updatedItems = state.items.map(item => 
              item.id === id 
                ? { 
                    ...item, 
                    ...itemData, 
                    updatedAt: Date.now() 
                  } 
                : item
            );
            return { items: updatedItems };
          });
          
          // Re-index all items in the search store
          // In a real implementation, you might just update the specific item
          const { indexKnowledgeBase } = useSearchStore.getState();
          await indexKnowledgeBase(get().items);
        } catch (error) {
          console.error('Failed to update knowledge item:', error);
          throw error;
        }
      },

      deleteItem: async (id: string) => {
        try {
          set(state => ({
            items: state.items.filter(item => item.id !== id)
          }));
          
          // Re-index all items in the search store after deletion
          // In a real implementation, you would remove the specific item from the index
          const { indexKnowledgeBase } = useSearchStore.getState();
          await indexKnowledgeBase(get().items);
        } catch (error) {
          console.error('Failed to delete knowledge item:', error);
          throw error;
        }
      },

      getItemById: (id: string) => {
        return get().items.find(item => item.id === id);
      },
    }),
    {
      name: 'knowledge-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);