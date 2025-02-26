'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Globe, ExternalLink } from 'lucide-react';

interface DeploymentStatusProps {
  deployId: string;
  siteName: string;
}

interface DeploymentState {
  status: 'pending' | 'building' | 'ready' | 'error';
  progress: number;
  url?: string;
  error?: string;
  claimed: boolean;
  claimUrl?: string;
}

export function DeploymentStatus({ deployId, siteName }: DeploymentStatusProps) {
  const [status, setStatus] = useState<DeploymentState>({
    status: 'pending',
    progress: 0,
    claimed: false
  });
  const [isPolling, setIsPolling] = useState(true);

  // Mock function to check deployment status - in a real app, this would call an API
  const checkDeploymentStatus = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll simulate a deployment process
      if (status.progress < 100) {
        if (status.progress < 20) {
          setStatus({
            ...status,
            status: 'pending',
            progress: status.progress + 20,
          });
        } else if (status.progress < 70) {
          setStatus({
            ...status,
            status: 'building',
            progress: status.progress + 15,
          });
        } else {
          setStatus({
            ...status,
            status: 'ready',
            progress: 100,
            url: `https://${siteName}.netlify.app`,
            claimed: Math.random() > 0.7, // Randomly set claimed status
            claimUrl: `https://app.netlify.com/claim/${deployId}`
          });
          setIsPolling(false);
        }
      }
    } catch (error) {
      console.error('Failed to check deployment status:', error);
      setStatus({
        ...status,
        status: 'error',
        error: 'Failed to check deployment status'
      });
      setIsPolling(false);
    }
  };

  useEffect(() => {
    if (isPolling) {
      const pollInterval = setInterval(checkDeploymentStatus, 2000);
      return () => clearInterval(pollInterval);
    }
  }, [isPolling, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Initial check
    checkDeploymentStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusDisplay = () => {
    switch (status.status) {
      case 'pending':
        return 'Initializing deployment...';
      case 'building':
        return 'Building your site...';
      case 'ready':
        return 'Deployment complete!';
      case 'error':
        return status.error || 'An error occurred during deployment';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Deployment Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">{getStatusDisplay()}</span>
            <span className="text-sm">{status.progress}%</span>
          </div>
          <Progress value={status.progress} />
        </div>

        {status.status === 'error' && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Deployment Failed</p>
              <p className="text-sm">{status.error}</p>
            </div>
          </div>
        )}

        {status.status === 'ready' && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Deployment Successful</p>
                {status.claimed ? (
                  <p className="text-sm">Your site is live at a new URL.</p>
                ) : (
                  <p className="text-sm">Your site is now live!</p>
                )}
              </div>
            </div>

            <div className="rounded-md border p-3">
              <h3 className="text-sm font-medium mb-2">Deployment URL</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600">{status.url}</span>
                <Button size="sm" variant="outline" asChild>
                  <a href={status.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Visit
                  </a>
                </Button>
              </div>
            </div>

            {!status.claimed && status.claimUrl && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-800">
                <h3 className="text-sm font-medium mb-1">Transfer Ownership</h3>
                <p className="text-xs mb-2">
                  You can transfer this deployment to your Netlify account using the claim link below.
                </p>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <a href={status.claimUrl} target="_blank" rel="noopener noreferrer">
                    Claim Site
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}