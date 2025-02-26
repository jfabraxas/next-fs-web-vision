'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIModel, ModelType } from '@/lib/types';

interface ModelConfig {
  isEnabled?: boolean;
  isDefault?: boolean;
  contextLength?: number;
  // In a real implementation, this would include more configuration options
}

interface ModelState {
  models: AIModel[];
  isLoading: boolean;
  error: string | null;
  fetchModels: (reset?: boolean) => Promise<void>;
  getModelById: (id: string) => Promise<AIModel | null>;
  toggleModelEnabled: (id: string, enabled: boolean) => Promise<void>;
  setDefaultModel: (id: string) => Promise<void>;
  updateModelConfig: (id: string, config: ModelConfig) => Promise<void>;
}

// Define default models that will be used if no models are stored
const defaultModels: AIModel[] = [
  {
    id: 'text-small',
    name: 'Text Small',
    description: 'Fast and efficient text model for general-purpose tasks',
    type: 'text',
    version: '1.0.0',
    parameters: 1_500_000_000,
    capabilities: [
      'Text generation',
      'Summarization',
      'Question answering',
      'Classification',
    ],
    limitations: [
      'Limited context understanding',
      'May produce generic responses',
      'Not suitable for complex reasoning',
    ],
    contextLength: 4096,
    thumbnailUrl: '',
    isEnabled: true,
    isDefault: true,
  },
  {
    id: 'text-large',
    name: 'Text Large',
    description: 'Advanced text model with strong reasoning capabilities',
    type: 'text',
    version: '1.0.0',
    parameters: 7_000_000_000,
    capabilities: [
      'Complex text generation',
      'In-depth reasoning',
      'Code generation and analysis',
      'Detailed explanations',
    ],
    limitations: [
      'Higher resource requirements',
      'Slower response times',
      'May occasionally hallucinate facts',
    ],
    contextLength: 8192,
    thumbnailUrl: '',
    isEnabled: true,
    isDefault: false,
  },
  {
    id: 'vision-model',
    name: 'Vision Model',
    description: 'Multimodal model for processing images and text',
    type: 'vision',
    version: '1.0.0',
    parameters: 5_000_000_000,
    capabilities: [
      'Image understanding',
      'Visual question answering',
      'Image captioning',
      'Object detection',
    ],
    limitations: [
      'Limited to 2D images',
      'May struggle with complex visual scenes',
      'Cannot process video content',
    ],
    contextLength: 4096,
    imageSize: '1024x1024',
    thumbnailUrl: '',
    isEnabled: true,
    isDefault: true,
  }
];

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      models: [],
      isLoading: false,
      error: null,

      fetchModels: async (reset = false) => {
        set({ isLoading: true, error: null });
        
        try {
          // In a real implementation, this would fetch from an API
          // For demonstration, we'll use the default models or existing models
          await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
          
          // If reset is true or no models exist, use default models
          if (reset || get().models.length === 0) {
            set({ models: defaultModels });
          }
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to fetch models:', error);
          set({ 
            error: 'Failed to load AI models. Please try again later.',
            isLoading: false
          });
        }
      },

      getModelById: async (id: string) => {
        try {
          const { models, fetchModels } = get();
          
          // If models array is empty, fetch models first
          if (models.length === 0) {
            await fetchModels();
          }
          
          const model = get().models.find(m => m.id === id);
          return model || null;
        } catch (error) {
          console.error('Failed to get model by ID:', error);
          return null;
        }
      },

      toggleModelEnabled: async (id: string, enabled: boolean) => {
        try {
          set(state => ({
            models: state.models.map(model => 
              model.id === id 
                ? { ...model, isEnabled: enabled } 
                : model
            )
          }));
        } catch (error) {
          console.error('Failed to toggle model enabled status:', error);
          throw error;
        }
      },

      setDefaultModel: async (id: string) => {
        try {
          const modelToDefault = get().models.find(m => m.id === id);
          
          if (!modelToDefault) {
            throw new Error('Model not found');
          }
          
          // Get the model type so we can update other models of the same type
          const modelType = modelToDefault.type;
          
          set(state => ({
            models: state.models.map(model => 
              model.type === modelType 
                ? { ...model, isDefault: model.id === id } 
                : model
            )
          }));
        } catch (error) {
          console.error('Failed to set default model:', error);
          throw error;
        }
      },

      updateModelConfig: async (id: string, config: ModelConfig) => {
        try {
          // In a real implementation, this would call an API
          await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
          
          set(state => ({
            models: state.models.map(model => 
              model.id === id 
                ? { ...model, ...config } 
                : model
            )
          }));
          
          // If this model is being set as default, update other models of the same type
          if (config.isDefault) {
            const modelToDefault = get().models.find(m => m.id === id);
            if (modelToDefault) {
              const modelType = modelToDefault.type;
              
              set(state => ({
                models: state.models.map(model => 
                  model.type === modelType && model.id !== id
                    ? { ...model, isDefault: false } 
                    : model
                )
              }));
            }
          }
        } catch (error) {
          console.error('Failed to update model configuration:', error);
          throw error;
        }
      },
    }),
    {
      name: 'models-storage',
      partialize: (state) => ({ models: state.models }),
    }
  )
);