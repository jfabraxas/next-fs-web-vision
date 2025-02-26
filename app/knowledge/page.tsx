'use client';

import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Database, FilePlus, Search, Tag, BookOpen, Folder, FileText, Edit, Trash2, Plus } from 'lucide-react';
import { KnowledgeBase, KnowledgeItemCategory } from '@/lib/types';
import { useSearchStore } from '@/lib/stores/search';
import { useKnowledgeStore } from '@/lib/stores/knowledge';
import { KnowledgeItem } from '@/components/knowledge/KnowledgeItem';
import { CreateKnowledgeForm } from '@/components/knowledge/CreateKnowledgeForm';

export default function KnowledgePage() {
  const { items, isLoading, error, fetchItems, deleteItem } = useKnowledgeStore();
  const { initializeSearch, searchKnowledge } = useSearchStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeBase[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeItemCategory | 'all'>('all');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Initialize the search index and fetch knowledge items
    initializeSearch().catch(console.error);
    fetchItems().catch(console.error);
  }, [initializeSearch, fetchItems]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchKnowledge(searchQuery);
      // Map search results to KnowledgeBase items
      // In a real implementation, you would properly extract the document IDs
      // and fetch the full documents from your store
      const knowledgeResults = results
        .map(result => items.find(item => item.id === result.document.id))
        .filter(Boolean) as KnowledgeBase[];
      
      setSearchResults(knowledgeResults);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const displayItems = searchQuery.trim() ? searchResults : filteredItems;

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Knowledge Base</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Knowledge Repository
            </CardTitle>
            <CardDescription>
              Access and manage your stored knowledge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  type="text" 
                  placeholder="Search knowledge base..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">Search</Button>
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add to Knowledge Base</DialogTitle>
                    <DialogDescription>
                      Create a new knowledge entry. Fill in the details below.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateKnowledgeForm onSuccess={() => setIsCreating(false)} />
                </DialogContent>
              </Dialog>
            </div>
            
            <Tabs defaultValue="all" onValueChange={(value) => setSelectedCategory(value as KnowledgeItemCategory | 'all')}>
              <TabsList className="grid grid-cols-4 md:grid-cols-7 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="document">Documents</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="image">Images</TabsTrigger>
                <TabsTrigger value="pdf">PDFs</TabsTrigger>
                <TabsTrigger value="webpage">Web</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-[500px] pr-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Card key={i} className="bg-muted/50">
                          <CardHeader className="h-10 animate-pulse"></CardHeader>
                          <CardContent className="h-20 animate-pulse"></CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : displayItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No items found</p>
                      <p className="text-sm">
                        {searchQuery.trim() 
                          ? "Try adjusting your search query" 
                          : "Add your first knowledge item by clicking 'Add New'"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayItems.map((item) => (
                        <KnowledgeItem 
                          key={item.id} 
                          item={item} 
                          onDelete={() => handleDeleteItem(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              {/* Repeat the same structure for other tabs - they'll use the filtered content */}
              {['document', 'code', 'image', 'pdf', 'webpage', 'other'].map((category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <ScrollArea className="h-[500px] pr-4">
                    {isLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Card key={i} className="bg-muted/50">
                            <CardHeader className="h-10 animate-pulse"></CardHeader>
                            <CardContent className="h-20 animate-pulse"></CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : displayItems.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No items found</p>
                        <p className="text-sm">
                          {searchQuery.trim() 
                            ? "Try adjusting your search query" 
                            : `Add your first ${category} item by clicking 'Add New'`}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {displayItems.map((item) => (
                          <KnowledgeItem 
                            key={item.id} 
                            item={item} 
                            onDelete={() => handleDeleteItem(item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Knowledge Stats
            </CardTitle>
            <CardDescription>
              Overview of your knowledge repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Total Items</span>
                <span className="text-2xl font-bold">{items.length}</span>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Categories</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Documents', icon: <FileText className="h-4 w-4" />, color: 'text-blue-500', count: items.filter(i => i.category === 'document').length },
                    { name: 'Code', icon: <Code className="h-4 w-4" />, color: 'text-yellow-500', count: items.filter(i => i.category === 'code').length },
                    { name: 'Images', icon: <Image className="h-4 w-4" />, color: 'text-green-500', count: items.filter(i => i.category === 'image').length },
                    { name: 'PDFs', icon: <FileText className="h-4 w-4" />, color: 'text-red-500', count: items.filter(i => i.category === 'pdf').length },
                    { name: 'Web Pages', icon: <Globe className="h-4 w-4" />, color: 'text-purple-500', count: items.filter(i => i.category === 'webpage').length },
                    { name: 'Other', icon: <File className="h-4 w-4" />, color: 'text-gray-500', count: items.filter(i => i.category === 'other').length },
                  ].map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 ${category.color}`}>
                        {category.icon} 
                        <span>{category.name}</span>
                      </div>
                      <span className="font-medium">{category.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Last Updated</h4>
                {items.length > 0 ? (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(Math.max(...items.map(i => i.updatedAt))).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No items yet</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// For Lucide React icons not imported at the top
const Code = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const Image = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const Globe = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const File = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>
);