'use client';

import React, { useState } from 'react';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useKnowledgeStore } from '@/lib/stores/knowledge';
import { Loader2 } from 'lucide-react';
import { KnowledgeItemCategory } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().min(5, 'Description must be at least 5 characters').max(500),
  category: z.enum(['document', 'code', 'image', 'pdf', 'webpage', 'other'] as const),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateKnowledgeFormProps {
  onSuccess?: () => void;
}

export function CreateKnowledgeForm({ onSuccess }: CreateKnowledgeFormProps) {
  const { createItem } = useKnowledgeStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'document',
      tags: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Convert tags string to array
      const tagsArray = values.tags
        ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      // In a real implementation, you'd upload files to storage
      // Here we just store the file names
      const fileNames = files.map(f => f.name);
      
      await createItem({
        name: values.name,
        description: values.description,
        category: values.category as KnowledgeItemCategory,
        tags: tagsArray,
        files: fileNames,
      });
      
      toast({
        title: 'Knowledge item created',
        description: 'Your knowledge item has been added to the database',
      });
      
      form.reset();
      setFiles([]);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create knowledge item:', error);
      toast({
        title: 'Error',
        description: 'Failed to create knowledge item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Knowledge item name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe this knowledge item" 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="webpage">Webpage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter tags separated by commas" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Example: research, important, reference
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel htmlFor="files">Attach Files</FormLabel>
          <Input 
            id="files"
            type="file" 
            multiple 
            onChange={handleFileChange}
            className="mt-1"
          />
          {files.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Selected files:</p>
              <ul className="text-sm mt-1">
                {files.map((file, index) => (
                  <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Knowledge Item
          </Button>
        </div>
      </form>
    </Form>
  );
}