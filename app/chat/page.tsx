'use client';

import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { useChatStore } from '@/lib/stores/chat';

export default function ChatPage() {
  const { currentModel } = useChatStore();

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Chat Interface</h1>
        <ModelSelector />
      </div>
      
      <div className="flex-1 min-h-0">
        <ChatInterface model={currentModel} />
      </div>
    </div>
  );
}