'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFileSystemStore } from '@/lib/stores/fileSystem';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const { initialize, isInitialized } = useFileSystemStore();

  useEffect(() => {
    initialize().catch(console.error);
  }, [initialize]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8 rounded-lg bg-white p-8 shadow-xl">
        <h1 className="text-4xl font-bold">Welcome to Next.js PWA</h1>
        <p className="text-lg text-gray-600">
          A modern Progressive Web Application with advanced chat and storage capabilities.
        </p>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Button
            onClick={() => router.push('/chat')}
            className="h-32 text-lg"
            variant="outline"
          >
            Chat Interface
            <span className="mt-2 block text-sm text-gray-500">
              Start a conversation with AI
            </span>
          </Button>

          <Button
            onClick={() => router.push('/storage')}
            className="h-32 text-lg"
            variant="outline"
          >
            Storage
            <span className="mt-2 block text-sm text-gray-500">
              Manage files and databases
            </span>
          </Button>

          <Button
            onClick={() => router.push('/knowledge')}
            className="h-32 text-lg"
            variant="outline"
          >
            Knowledge Base
            <span className="mt-2 block text-sm text-gray-500">
              Access and manage stored knowledge
            </span>
          </Button>

          <Button
            onClick={() => router.push('/settings')}
            className="h-32 text-lg"
            variant="outline"
          >
            Settings
            <span className="mt-2 block text-sm text-gray-500">
              Configure application preferences
            </span>
          </Button>
        </div>

        {!isInitialized && (
          <p className="text-center text-sm text-yellow-600">
            Initializing file system...
          </p>
        )}
      </div>
    </div>
  );
}