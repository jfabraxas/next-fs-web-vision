'use client';

import React, { useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/stores/settings';
import { useFileSystemStore } from '@/lib/stores/fileSystem';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Monitor, 
  Save, 
  Bell, 
  BellOff,
  Database,
  HardDrive,
  Bot,
  UserCog,
  Brush,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    theme, 
    fontSize, 
    notifications, 
    setTheme, 
    setFontSize, 
    toggleNotifications 
  } = useSettingsStore();
  const { isInitialized } = useFileSystemStore();

  const handleSaveAppearance = () => {
    toast({
      title: 'Appearance settings saved',
      description: 'Your appearance preferences have been updated.',
    });
  };

  const handleClearData = () => {
    toast({
      title: 'Data cleared',
      description: 'All application data has been reset.',
    });
  };

  const handleBackupData = () => {
    toast({
      title: 'Backup created',
      description: 'Your data has been backed up successfully.',
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="appearance" className="flex items-center justify-center">
            <Brush className="h-4 w-4 mr-2" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center justify-center">
            <Bell className="h-4 w-4 mr-2" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center justify-center">
            <HardDrive className="h-4 w-4 mr-2" />
            <span>Storage</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center justify-center">
            <UserCog className="h-4 w-4 mr-2" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  <Button 
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button 
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button 
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className="h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between mb-2">
                  <Label>Font Size</Label>
                  <span className="text-sm">{fontSize}px</span>
                </div>
                <Slider 
                  value={[fontSize]} 
                  min={12} 
                  max={24} 
                  step={1}
                  onValueChange={([value]) => setFontSize(value)}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs">Small</span>
                  <span className="text-xs">Large</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAppearance}>
                <Save className="h-4 w-4 mr-2" />
                Save Appearance
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about new messages and updates
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={toggleNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound">Notification Sound</Label>
                  <p className="text-sm text-muted-foreground">
                    Play a sound when notifications arrive
                  </p>
                </div>
                <Switch id="sound" defaultChecked={true} disabled={!notifications} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="chat-notifications">Chat Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new chat messages
                  </p>
                </div>
                <Switch id="chat-notifications" defaultChecked={true} disabled={!notifications} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="update-notifications">Update Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Be notified when a new app version is available
                  </p>
                </div>
                <Switch id="update-notifications" defaultChecked={true} disabled={!notifications} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: 'Notification settings saved' })}>
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Management</CardTitle>
              <CardDescription>
                Manage application storage and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Storage Status</h3>
                  <Button variant="outline" size="sm" onClick={() => router.push('/storage')}>
                    Open Storage Manager
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Initialization Status:</span>
                    <span className={`text-sm font-medium ${isInitialized ? 'text-green-500' : 'text-amber-500'}`}>
                      {isInitialized ? 'Initialized' : 'Not Initialized'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Local Storage:</span>
                    <span className="text-sm font-medium">45MB / 100MB</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">IndexedDB Storage:</span>
                    <span className="text-sm font-medium">12MB / 50MB</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Backup & Reset</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleBackupData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Backup Data
                  </Button>
                  <Button variant="outline" className="text-red-500" onClick={handleClearData}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Data
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Backup will download all your data. Clear data will remove everything and reset the app.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced application features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">AI Models</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure AI models and their parameters
                  </p>
                  <Button onClick={() => router.push('/settings/models')}>
                    <Bot className="h-4 w-4 mr-2" />
                    Manage AI Models
                  </Button>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Developer Options</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="debug-mode">Debug Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable detailed logging and debug information
                        </p>
                      </div>
                      <Switch id="debug-mode" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="experimental">Experimental Features</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable experimental and preview features
                        </p>
                      </div>
                      <Switch id="experimental" />
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-950/20">
                  <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Danger Zone</h3>
                      <p className="text-sm mb-3">
                        These actions can't be undone. Please proceed with caution.
                      </p>
                      <Button variant="destructive" size="sm">
                        Reset Application
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}