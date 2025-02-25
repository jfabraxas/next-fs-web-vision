'use client';

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon } from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat';
import { ModelType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatInputProps {
  disabled?: boolean;
  model: ModelType;
}

export function ChatInput({ disabled, model }: ChatInputProps) {
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addMessage, setIsStreaming } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !fileInputRef.current?.files?.length) return;

    const messageId = uuidv4();
    let content = input;
    let type: 'text' | 'image' = 'text';
    let imageUrl: string | undefined;

    // Handle file upload if present
    if (fileInputRef.current?.files?.length) {
      const file = fileInputRef.current.files[0];
      // In a real implementation, you would upload the file to a server
      // and get back a URL. For now, we'll create an object URL
      imageUrl = URL.createObjectURL(file);
      type = 'image';
    }

    // Add user message
    addMessage({
      id: messageId,
      role: 'user',
      content,
      type,
      imageUrl,
      timestamp: Date.now(),
    });

    // Clear input
    setInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // In a real implementation, you would:
    // 1. Send the message to your AI service
    // 2. Stream the response
    // 3. Update the UI accordingly
    setIsStreaming(true);
    
    // Simulate AI response
    setTimeout(() => {
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: 'This is a simulated response. In a real implementation, this would be the AI\'s response.',
        type: 'text',
        timestamp: Date.now(),
      });
      setIsStreaming(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={() => handleSubmit({ preventDefault: () => {} } as any)}
      />
      {model === 'vision' && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
      )}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
      />
      <Button type="submit" disabled={disabled}>
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}