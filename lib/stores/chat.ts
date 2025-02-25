import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, ModelType } from '@/lib/types';

interface ChatState {
  messages: ChatMessage[];
  currentModel: ModelType;
  isStreaming: boolean;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  setCurrentModel: (model: ModelType) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      currentModel: 'text',
      isStreaming: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, content) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, content } : msg
          ),
        })),
      setCurrentModel: (model) => set({ currentModel: model }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'chat-storage',
    }
  )
);