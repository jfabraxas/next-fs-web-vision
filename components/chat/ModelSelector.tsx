'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatStore } from '@/lib/stores/chat';
import { ModelType } from '@/lib/types';

export function ModelSelector() {
  const { currentModel, setCurrentModel } = useChatStore();

  return (
    <Select
      value={currentModel}
      onValueChange={(value) => setCurrentModel(value as ModelType)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="text">Text Model</SelectItem>
        <SelectItem value="vision">Vision Model</SelectItem>
      </SelectContent>
    </Select>
  );
}