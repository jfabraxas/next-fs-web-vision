'use client';

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileSystemEntry } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft,
  File, 
  Folder, 
  FileText, 
  Image as FileImage, 
  FileCode, 
  MoreVertical, 
  Download,
  Trash2,
  Edit,
  Share
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FileBrowserProps {
  entries: FileSystemEntry[];
  currentPath: string;
  onNavigate: (path: string) => void;
  isLoading: boolean;
}

export function FileBrowser({ entries, currentPath, onNavigate, isLoading }: FileBrowserProps) {
  const formatFileSize = (size: number = 0): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileIcon = (name: string, type: 'file' | 'directory'): JSX.Element => {
    if (type === 'directory') return <Folder className="h-5 w-5 text-blue-500" />;
    
    const extension = name.split('.').pop()?.toLowerCase() || '';
    
    switch(extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <FileImage className="h-5 w-5 text-green-500" />;
      case 'txt':
      case 'md':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
        return <FileCode className="h-5 w-5 text-yellow-500" />;
      default:
        return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    onNavigate('/' + pathParts.join('/'));
  };

  const handleEntryClick = (entry: FileSystemEntry) => {
    if (entry.type === 'directory') {
      onNavigate(entry.path);
    } else {
      // Handle file click - preview or open
      console.log('Opening file:', entry.path);
    }
  };

  const handleDownload = (entry: FileSystemEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Downloading:', entry.path);
  };

  const handleDelete = (entry: FileSystemEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Deleting:', entry.path);
  };

  const handleRename = (entry: FileSystemEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Renaming:', entry.path);
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={navigateUp}
          disabled={currentPath === '/'}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Up
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No files or folders found in this location.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow 
                key={entry.path} 
                className={entry.type === 'directory' ? 'cursor-pointer hover:bg-gray-50' : ''}
                onClick={() => handleEntryClick(entry)}
              >
                <TableCell className="font-medium flex items-center gap-2">
                  {getFileIcon(entry.name, entry.type)}
                  {entry.name}
                </TableCell>
                <TableCell>{entry.type === 'directory' ? '--' : formatFileSize(entry.size)}</TableCell>
                <TableCell>
                  {entry.lastModified 
                    ? formatDistanceToNow(entry.lastModified, { addSuffix: true }) 
                    : '--'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {entry.type === 'file' && (
                        <DropdownMenuItem onClick={(e) => handleDownload(entry, e as any)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => handleRename(entry, e as any)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleDelete(entry, e as any)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}