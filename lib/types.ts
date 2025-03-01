export type ModelType = 'text' | 'vision';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type: 'text' | 'image';
  imageUrl?: string;
}

export interface FileSystemEntry {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  lastModified?: number;
}

export type KnowledgeItemCategory = 'pdf' | 'git' | 'image' | 'document' | 'webpage' | 'code' | 'other';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  files: string[];
  createdAt: number;
  updatedAt: number;
  category?: KnowledgeItemCategory;
  tags?: string[];
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  version: string;
  parameters: number;
  capabilities: string[];
  limitations: string[];
  contextLength: number;
  imageSize?: string;
  thumbnailUrl: string;
  detailsUrl?: string;
  isDefault?: boolean;
  isEnabled: boolean;
}