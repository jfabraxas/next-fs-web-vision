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

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  files: string[];
  createdAt: number;
  updatedAt: number;
}