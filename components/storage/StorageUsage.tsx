'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, Database, FileText } from 'lucide-react';

interface StorageUsageProps {
  used: number;
  total: number;
  percentage: number;
  isLoading: boolean;
}

export function StorageUsage({ used, total, percentage, isLoading }: StorageUsageProps) {
  // Determine color based on percentage
  const getColorClass = (percent: number) => {
    if (percent < 60) return 'text-green-500';
    if (percent < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (percent: number) => {
    if (percent < 60) return 'bg-green-500';
    if (percent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <HardDrive className="h-5 w-5 mr-2" />
          Storage Usage
        </CardTitle>
        <CardDescription>
          Overview of your storage utilization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {used} MB used of {total} MB
              </span>
              <span className={`font-bold ${getColorClass(percentage)}`}>
                {percentage}%
              </span>
            </div>
            
            <Progress value={percentage} className={`h-2 ${getProgressColor(percentage)}`} />

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">Documents</span>
                </div>
                <span className="text-sm font-medium">23 MB</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-sm">Database</span>
                </div>
                <span className="text-sm font-medium">18 MB</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HardDrive className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">Other</span>
                </div>
                <span className="text-sm font-medium">4 MB</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}