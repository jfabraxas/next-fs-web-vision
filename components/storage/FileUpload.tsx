'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileUp } from 'lucide-react';

interface FileUploadProps {
  currentPath: string;
}

export function FileUpload({ currentPath }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // In a real implementation, you would upload the files to your storage system
    console.log('Uploading files to path:', currentPath, files);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div 
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={triggerFileInput}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          multiple
        />
        <FileUp className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop files here or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Upload to: {currentPath}
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Selected Files ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <div className="flex items-center">
                  <span className="text-sm truncate max-w-[250px]">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <button 
                  className="text-red-500 hover:bg-red-50 p-1 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          {uploading ? (
            <div className="mt-4">
              <Progress value={progress} className="mb-2" />
              <p className="text-xs text-center text-gray-500">Uploading: {progress}%</p>
            </div>
          ) : (
            <Button 
              className="mt-4 w-full" 
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload {files.length} {files.length === 1 ? 'file' : 'files'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}