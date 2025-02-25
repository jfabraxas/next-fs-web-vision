'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Dir, configureSingle, default as fs } from '@zenfs/core';
import { WebStorage } from '@zenfs/dom';

type FS = typeof fs;

interface FileSystemState {
  fs: FS | null;
  rootHandle: Dir | FileSystemHandle | null;
  isInitialized: boolean;
  setFileSystem: (fs: FS) => void;
  setRootHandle: (handle: Dir) => void;
  initialize: () => Promise<void>;
}

export const useFileSystemStore = create<FileSystemState>()(
  persist(
    (set, get) => ({
      fs: null,
      rootHandle: null,
      isInitialized: false,
      setFileSystem: (fs) => set({ fs }),
      setRootHandle: (handle) => set({ rootHandle: handle }),
      initialize: async () => {
        if (get().isInitialized) return;

        try {
          await configureSingle({ backend: WebStorage });

          const filesystem =
            fs ??
            (await import('@zenfs/core').then((module) => {
              console.log(module);
            }));
          //await fs.init();
          set({ fs: filesystem, isInitialized: true });
        } catch (error) {
          console.error('Failed to initialize file system:', error);
          throw error;
        }
      },
    }),
    {
      name: 'file-system-storage',
      partialize: (state) => ({
        rootHandle: state.rootHandle,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
