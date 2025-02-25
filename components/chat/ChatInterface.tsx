'use client';

import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { useChatStore } from '@/lib/stores/chat';
import { ModelType } from '@/lib/types';

interface ChatInterfaceProps {
  model: ModelType;
}

export function ChatInterface({ model }: ChatInterfaceProps) {
  const { messages, isStreaming } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <MessageList messages={messages} />
      </ScrollArea>
      <div className="p-4 border-t">
        <ChatInput disabled={isStreaming} model={model} />
      </div>
    </Card>
  );
}