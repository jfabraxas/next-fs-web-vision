'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useModelStore } from '@/lib/stores/models';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Settings, 
  Bot, 
  Eye, 
  Power, 
  AlertTriangle, 
  Zap,
  RefreshCw
} from 'lucide-react';

export default function AIModelsPage() {
  const router = useRouter();
  const { models, isLoading, error, fetchModels, toggleModelEnabled, setDefaultModel } = useModelStore();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    fetchModels().catch(console.error);
  }, [fetchModels]);

  const handleToggleModel = async (id: string, currentEnabled: boolean) => {
    try {
      await toggleModelEnabled(id, !currentEnabled);
    } catch (error) {
      console.error('Failed to toggle model:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultModel(id);
    } catch (error) {
      console.error('Failed to set default model:', error);
    }
  };

  const handleResetModels = async () => {
    try {
      // Reset models to default settings
      await fetchModels(true);
      setResetConfirmOpen(false);
    } catch (error) {
      console.error('Failed to reset models:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
        <h1 className="text-3xl font-bold">AI Models</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>
            Configure AI models used throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          )}
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parameters</TableHead>
                    <TableHead>Context Size</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div>
                            <div>{model.name}</div>
                            <div className="text-xs text-muted-foreground">v{model.version}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={model.type === 'vision' ? 'default' : 'outline'}>
                          {model.type === 'vision' ? 'Vision' : 'Text'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {model.parameters.toLocaleString()} params
                      </TableCell>
                      <TableCell>
                        {model.contextLength.toLocaleString()} tokens
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {model.isDefault ? (
                            <Badge className="bg-green-500">Default</Badge>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSetDefault(model.id)}
                            >
                              Set Default
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={model.isEnabled} 
                          onCheckedChange={() => handleToggleModel(model.id, model.isEnabled)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/settings/models/${model.id}`)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => fetchModels()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Power className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all models?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all model configurations to their default settings.
                  Any custom configurations will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetModels}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Model Performance
            </CardTitle>
            <CardDescription>
              Tips for optimal performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Disable models you don't use to save resources</li>
              <li>Text models are faster and use less memory</li>
              <li>Vision models may require more processing power</li>
              <li>Set a balanced context length for your specific needs</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Using Vision Models
            </CardTitle>
            <CardDescription>
              How to get the best results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Use high-quality images for better analysis</li>
              <li>Ensure images are clearly focused on the subject</li>
              <li>Provide context in your prompts for better understanding</li>
              <li>Vision models work best with PNG or JPG formats</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-500" />
              Advanced Configuration
            </CardTitle>
            <CardDescription>
              Customize your AI experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Each model can be configured with custom parameters from its dedicated configuration page.
            </p>
            <Button variant="outline" className="w-full" onClick={() => router.push('/settings')}>
              Return to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}