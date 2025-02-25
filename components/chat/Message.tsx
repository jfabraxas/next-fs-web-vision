'use client';

import React from 'react';
import { ChatMessage } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message }: MessageProps) {
  const isBot = message.role === 'assistant';

  return (
    <div className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
      <Avatar className={isBot ? 'bg-blue-500' : 'bg-green-500'}>
        {isBot ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
      </Avatar>
      <Card className={`flex-1 p-4 ${isBot ? 'bg-muted' : 'bg-primary/5'}`}>
        {message.type === 'image' && message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Uploaded content"
            className="max-w-sm rounded-lg mb-2"
          />
        )}
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </Card>
    </div>
  );
}