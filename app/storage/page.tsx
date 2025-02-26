'use client';

import React, { useState, useEffect } from 'react';
import { useFileSystemStore } from '@/lib/stores/fileSystem';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/storage/FileUpload';
import { FileBrowser } from '@/components/storage/FileBrowser';
import { StorageUsage } from '@/components/storage/StorageUsage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileSystemEntry } from '@/lib/types';
import { AlertCircle, Trash2, RefreshCw, FileUp, FolderPlus } from 'lucide-react';

export default function StoragePage() {
  const { isInitialized, initialize } = useFileSystemStore();
  const [storageStats, setStorageStats] = useState({
    used: 0,
    total: 100,
    percentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<FileSystemEntry[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('/');

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        setIsLoading(true);
        if (!isInitialized) {
          await initialize();
        }
        // Mock data - in a real implementation, we would fetch actual storage stats
        setStorageStats({
          used: 45,
          total: 100,
          percentage: 45,
        });
        
        // Mock data - in a real implementation, we would fetch actual file entries
        const mockEntries: FileSystemEntry[] = [
          { name: 'Documents', type: 'directory', path: '/Documents', size: 0 },
          { name: 'Images', type: 'directory', path: '/Images', size: 0 },
          { name: 'report.pdf', type: 'file', path: '/report.pdf', size: 2.5 * 1024 * 1024, lastModified: Date.now() - 86400000 },
          { name: 'notes.txt', type: 'file', path: '/notes.txt', size: 15 * 1024, lastModified: Date.now() - 3600000 },
        ];
        
        setEntries(mockEntries);
        setError(null);
      } catch (err) {
        console.error('Error initializing storage:', err);
        setError('Failed to initialize storage. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, [initialize, isInitialized]);

  const handleFolderCreate = () => {
    // Implementation for creating a new folder
    console.log('Create folder in path:', currentPath);
  };

  const handleRefresh = () => {
    // Implementation for refreshing the file list
    console.log('Refreshing files in path:', currentPath);
  };

  const handleCleanup = () => {
    // Implementation for storage cleanup
    console.log('Cleaning up storage');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Storage Management</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <StorageUsage 
          used={storageStats.used} 
          total={storageStats.total} 
          percentage={storageStats.percentage} 
          isLoading={isLoading} 
        />
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your storage with these tools</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col h-24 items-center justify-center" onClick={handleFolderCreate}>
              <FolderPlus className="h-8 w-8 mb-2" />
              <span>New Folder</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-24 items-center justify-center">
              <FileUp className="h-8 w-8 mb-2" />
              <span>Upload</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-24 items-center justify-center" onClick={handleRefresh}>
              <RefreshCw className="h-8 w-8 mb-2" />
              <span>Refresh</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex flex-col h-24 items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-8 w-8 mb-2" />
                  <span>Clean up</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete unused or temporary files from your storage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCleanup}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="files" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>File Browser</CardTitle>
              <CardDescription>
                Current path: {currentPath}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileBrowser 
                entries={entries} 
                currentPath={currentPath}
                onNavigate={setCurrentPath}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Upload files to your storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload currentPath={currentPath} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}