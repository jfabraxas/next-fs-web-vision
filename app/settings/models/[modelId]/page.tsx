'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  BadgeInfo, 
  Bot, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  Zap, 
  Cpu, 
  Gauge, 
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { useModelStore } from '@/lib/stores/models';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AIModel } from '@/lib/types';

export default function ModelConfigPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { models, isLoading, error, getModelById, updateModelConfig } = useModelStore();
  const [model, setModel] = useState<AIModel | null>(null);
  const [config, setConfig] = useState({
    temperature: 0.7,
    topP: 0.9,
    contextLength: 4096,
    maxOutputTokens: 1024,
    streamOutput: true,
    isDefault: false,
    isEnabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const modelId = typeof params.modelId === 'string' ? params.modelId : '';

  useEffect(() => {
    if (!modelId) return;
    
    const fetchModel = async () => {
      try {
        const modelData = await getModelById(modelId);
        if (modelData) {
          setModel(modelData);
          
          // Initialize config with model's current values
          // In a real implementation, this would include model-specific configurations
          setConfig({
            temperature: 0.7,
            topP: 0.9,
            contextLength: modelData.contextLength,
            maxOutputTokens: 1024,
            streamOutput: true,
            isDefault: modelData.isDefault || false,
            isEnabled: modelData.isEnabled,
          });
        }
      } catch (error) {
        console.error('Failed to fetch model:', error);
      }
    };
    
    fetchModel();
  }, [modelId, getModelById]);
  
  const handleSave = async () => {
    if (!model) return;
    
    setIsSaving(true);
    try {
      await updateModelConfig(model.id, {
        isDefault: config.isDefault,
        isEnabled: config.isEnabled,
        contextLength: config.contextLength,
        // In a real implementation, you would include all configurable parameters
      });
      
      toast({
        title: 'Configuration saved',
        description: `${model.name} has been updated successfully.`,
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save model configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.push('/settings/models')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Models
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.push('/settings/models')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Models
          </Button>
          <h1 className="text-3xl font-bold">Model Not Found</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p>
                {error || "The requested model could not be found. Please select a different model."}
              </p>
            </div>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/settings/models')}
            >
              Return to Models
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/settings/models')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Models
        </Button>
        <h1 className="text-3xl font-bold">{model.name}</h1>
        <span className="text-sm text-muted-foreground ml-2">v{model.version}</span>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic model settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Enable Model</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this model globally
                  </p>
                </div>
                <Switch 
                  id="enabled" 
                  checked={config.isEnabled}
                  onCheckedChange={(checked) => setConfig({...config, isEnabled: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="default">Set as Default</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this the default model for {model.type === 'vision' ? 'vision' : 'text'} tasks
                  </p>
                </div>
                <Switch 
                  id="default" 
                  checked={config.isDefault}
                  onCheckedChange={(checked) => setConfig({...config, isDefault: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="stream">Stream Output</Label>
                  <p className="text-sm text-muted-foreground">
                    Stream the model's response as it's generated
                  </p>
                </div>
                <Switch 
                  id="stream" 
                  checked={config.streamOutput}
                  onCheckedChange={(checked) => setConfig({...config, streamOutput: checked})}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="context-length">Context Length</Label>
                  <span className="text-sm">{config.contextLength.toLocaleString()} tokens</span>
                </div>
                <Slider
                  id="context-length"
                  min={1024}
                  max={32768}
                  step={1024}
                  value={[config.contextLength]}
                  onValueChange={([value]) => setConfig({...config, contextLength: value})}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1K</span>
                  <span>32K</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Larger context allows for more information but uses more resources.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/settings/models')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Fine-tune model parameters for optimal performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="temperature">Temperature</Label>
                  <span className="text-sm">{config.temperature.toFixed(2)}</span>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={2}
                  step={0.01}
                  value={[config.temperature]}
                  onValueChange={([value]) => setConfig({...config, temperature: value})}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>More Focused</span>
                  <span>More Random</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Controls randomness. Lower values make responses more deterministic.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="top-p">Top P</Label>
                  <span className="text-sm">{config.topP.toFixed(2)}</span>
                </div>
                <Slider
                  id="top-p"
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={[config.topP]}
                  onValueChange={([value]) => setConfig({...config, topP: value})}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precise</span>
                  <span>Diverse</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Controls token diversity. Lower values make responses more focused.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="max-output">Max Output Length</Label>
                  <span className="text-sm">{config.maxOutputTokens.toLocaleString()} tokens</span>
                </div>
                <Slider
                  id="max-output"
                  min={256}
                  max={4096}
                  step={256}
                  value={[config.maxOutputTokens]}
                  onValueChange={([value]) => setConfig({...config, maxOutputTokens: value})}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>256</span>
                  <span>4096</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum number of tokens the model can generate in a response.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/settings/models')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Model Information</CardTitle>
              <CardDescription>
                Technical details about {model.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Model Type</p>
                    <p className="text-lg">{model.type === 'vision' ? 'Vision' : 'Text'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Version</p>
                    <p className="text-lg">{model.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Parameters</p>
                    <p className="text-lg">{model.parameters.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Context Length</p>
                    <p className="text-lg">{model.contextLength.toLocaleString()} tokens</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Capabilities</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {model.capabilities.map((capability, index) => (
                    <li key={index} className="text-sm">{capability}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Limitations</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {model.limitations.map((limitation, index) => (
                    <li key={index} className="text-sm">{limitation}</li>
                  ))}
                </ul>
              </div>
              
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-2">
                  <BadgeInfo className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Recommended Usage</h3>
                    <p className="text-sm">
                      {model.type === 'vision' 
                        ? 'This model works best with clear images and specific questions about visual content.'
                        : 'This model excels at generating coherent text responses based on the provided prompts.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Cpu className="h-4 w-4 mr-2 text-purple-500" />
              Performance Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Higher context lengths and parameters increase memory usage and response time.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Gauge className="h-4 w-4 mr-2 text-amber-500" />
              Optimal Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              For most use cases, a temperature of 0.7 and top-p of 0.9 provide a good balance.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
              Quality Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Clear instructions and well-structured prompts lead to better results from the model.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}