import { GraphQLError } from 'graphql';

export const fileSystemResolvers = {
  Query: {
    fileSystemEntry: async (_, { id, path }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to access file system', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      let entry;
      
      if (id) {
        entry = await dataSources.fileSystemAPI.getFileById(id);
      } else if (path) {
        entry = await dataSources.fileSystemAPI.getFileByPath(path);
      } else {
        throw new GraphQLError('Either id or path must be provided', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      if (!entry) {
        throw new GraphQLError('File or directory not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user has permission to access this entry
      const hasAccess = await dataSources.fileSystemAPI.checkUserAccess(entry.id, user.id);
      
      if (!hasAccess && entry.ownerId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('Access denied to this file system entry', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      return entry;
    },
    
    fileSystemEntries: async (_, { parentId, path, type, first = 20, after }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to access file system', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      let parentEntry = null;
      
      // Get parent entry either by ID or path
      if (parentId) {
        parentEntry = await dataSources.fileSystemAPI.getFileById(parentId);
      } else if (path) {
        parentEntry = await dataSources.fileSystemAPI.getFileByPath(path);
      }
      
      // If parent specified but not found, throw error
      if ((parentId || path) && !parentEntry) {
        throw new GraphQLError('Parent directory not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check permissions if we have a parent
      if (parentEntry) {
        const hasAccess = await dataSources.fileSystemAPI.checkUserAccess(parentEntry.id, user.id);
        
        if (!hasAccess && parentEntry.ownerId !== user.id && user.role !== 'ADMIN') {
          throw new GraphQLError('Access denied to this directory', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        // Parent must be a directory
        if (parentEntry.type !== 'DIRECTORY') {
          throw new GraphQLError('Parent is not a directory', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
      }
      
      // Get entries
      const { entries, hasNextPage, endCursor, totalCount } = await dataSources.fileSystemAPI.getEntries({
        parentId: parentEntry?.id,
        path: path || (parentEntry ? undefined : '/'),
        type,
        first,
        after,
        userId: user.id,
      });
      
      return {
        edges: entries.map(entry => ({
          cursor: entry.id,
          node: entry,
        })),
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: entries.length > 0 ? entries[0].id : null,
          endCursor,
        },
        totalCount,
      };
    },
  },
  
  Mutation: {
    createDirectory: async (_, { parentId, path, name }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to create directories', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Sanitize directory name
      const sanitizedName = name.replace(/[\/\\:*?"<>|]/g, '_');
      
      if (sanitizedName !== name) {
        throw new GraphQLError('Directory name contains invalid characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      let parentPath;
      
      if (parentId) {
        const parentEntry = await dataSources.fileSystemAPI.getFileById(parentId);
        
        if (!parentEntry) {
          throw new GraphQLError('Parent directory not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        if (parentEntry.type !== 'DIRECTORY') {
          throw new GraphQLError('Parent is not a directory', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        
        // Check if user has write access to parent
        const hasAccess = await dataSources.fileSystemAPI.checkUserAccess(
          parentEntry.id, 
          user.id, 
          'WRITE'
        );
        
        if (!hasAccess && parentEntry.ownerId !== user.id && user.role !== 'ADMIN') {
          throw new GraphQLError('You do not have permission to write to this directory', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        parentPath = parentEntry.path;
      } else {
        parentPath = path || '/';
      }
      
      // Check if directory with this name already exists
      const fullPath = `${parentPath === '/' ? '' : parentPath}/${sanitizedName}`;
      const existingEntry = await dataSources.fileSystemAPI.getFileByPath(fullPath);
      
      if (existingEntry) {
        throw new GraphQLError('A file or directory with this name already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      // Create the directory
      const directory = await dataSources.fileSystemAPI.createDirectory({
        name: sanitizedName,
        path: fullPath,
        parentId: parentId || undefined,
        ownerId: user.id,
      });
      
      // Publish file system update event
      dataSources.pubsub.publish(`FILE_SYSTEM_UPDATED:${parentPath}`, {
        fileSystemUpdated: directory,
      });
      
      return directory;
    },
    
    uploadFile: async (_, { parentId, path, file, overwrite = false }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to upload files', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Process the uploaded file
      const { processUploadedFile, saveFile } = await import('../../upload/multipart');
      const processed = await processUploadedFile(file);
      
      // Sanitize filename
      const sanitizedName = processed.filename.replace(/[\/\\:*?"<>|]/g, '_');
      
      let parentPath;
      
      if (parentId) {
        const parentEntry = await dataSources.fileSystemAPI.getFileById(parentId);
        
        if (!parentEntry) {
          throw new GraphQLError('Parent directory not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        if (parentEntry.type !== 'DIRECTORY') {
          throw new GraphQLError('Parent is not a directory', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        
        // Check if user has write access to parent
        const hasAccess = await dataSources.fileSystemAPI.checkUserAccess(
          parentEntry.id, 
          user.id, 
          'WRITE'
        );
        
        if (!hasAccess && parentEntry.ownerId !== user.id && user.role !== 'ADMIN') {
          throw new GraphQLError('You do not have permission to write to this directory', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        
        parentPath = parentEntry.path;
      } else {
        parentPath = path || '/';
      }
      
      // Check if file with this name already exists
      const fullPath = `${parentPath === '/' ? '' : parentPath}/${sanitizedName}`;
      const existingEntry = await dataSources.fileSystemAPI.getFileByPath(fullPath);
      
      if (existingEntry && !overwrite) {
        throw new GraphQLError('A file with this name already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      // Save the file to storage
      const filePath = await saveFile(
        processed, 
        parentPath, 
        { overwrite }
      );
      
      // Create or update file in database
      let fileEntry;
      
      if (existingEntry && overwrite) {
        // Create a new version of the existing file
        await dataSources.fileSystemAPI.createFileVersion({
          fileId: existingEntry.id,
          size: existingEntry.size,
          createdBy: existingEntry.ownerId,
        });
        
        // Update the existing file
        fileEntry = await dataSources.fileSystemAPI.updateFile(existingEntry.id, {
          size: processed.size,
          contentType: processed.mimetype,
          modifiedAt: new Date(),
        });
      } else {
        // Create a new file entry
        fileEntry = await dataSources.fileSystemAPI.createFile({
          name: sanitizedName,
          path: fullPath,
          parentId: parentId || undefined,
          size: processed.size,
          contentType: processed.mimetype,
          ownerId: user.id,
        });
      }
      
      // Create file metadata
      // For image files, extract dimensions and other metadata
      if (processed.mimetype.startsWith('image/')) {
        try {
          // In a real implementation, we would extract metadata from the image
          await dataSources.fileSystemAPI.createFileMetadata({
            fileId: fileEntry.id,
            width: 0, // Would be extracted from image
            height: 0, // Would be extracted from image
            contentType: processed.mimetype,
          });
        } catch (error) {
          console.error('Failed to create file metadata:', error);
        }
      }
      
      // Publish file system update event
      dataSources.pubsub.publish(`FILE_SYSTEM_UPDATED:${parentPath}`, {
        fileSystemUpdated: fileEntry,
      });
      
      return fileEntry;
    },
    
    updateFile: async (_, { id, file }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to update files', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const existingEntry = await dataSources.fileSystemAPI.getFileById(id);
      
      if (!existingEntry) {
        throw new GraphQLError('File not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      if (existingEntry.type !== 'FILE') {
        throw new GraphQLError('Entry is not a file', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      // Check if user has write access
      const hasAccess = await dataSources.fileSystemAPI.checkUserAccess(
        existingEntry.id, 
        user.id, 
        'WRITE'
      );
      
      if (!hasAccess && existingEntry.ownerId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('You do not have permission to update this file', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Process the uploaded file
      const { processUploadedFile, saveFile } = await import('../../upload/multipart');
      const processed = await processUploadedFile(file);
      
      // Create a new version of the existing file
      await dataSources.fileSystemAPI.createFileVersion({
        fileId: existingEntry.id,
        size: existingEntry.size,
        createdBy: user.id,
      });
      
      // Save the file to storage
      await saveFile(
        processed, 
        existingEntry.path.substring(0, existingEntry.path.lastIndexOf('/')), 
        { overwrite: true }
      );
      
      // Update the file entry
      const updatedFile = await dataSources.fileSystemAPI.updateFile(id, {
        size: processed.size,
        contentType: processed.mimetype,
        modifiedAt: new Date(),
      });
      
      // Publish file system update event
      dataSources.pubsub.publish(`FILE_SYSTEM_UPDATED:${existingEntry.path}`, {
        fileSystemUpdated: updatedFile,
      });
      
      return updatedFile;
    },
    
    moveEntry: async (_, { id, destinationPath }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to move files', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const entry = await dataSources.fileSystemAPI.getFileById(id);
      
      if (!entry) {
        throw new GraphQLError('File or directory not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user has write access to the entry
      const hasAccess = await dataSources.fileSystemAPI.checkUserAccess(
        entry.id, 
        user.id, 
        'WRITE'
      );
      
      if (!hasAccess && entry.ownerId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('You do not have permission to move this entry', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Check if destination exists and is a directory
      const destinationEntry = await dataSources.fileSystemAPI.getFileByPath(destinationPath);
      
      if (!destinationEntry) {
        throw new GraphQLError('Destination directory not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      if (destinationEntry.type !== 'DIRECTORY') {
        throw new GraphQLError('Destination is not a directory', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      // Check if user has write access to the destination
      const hasDestAccess = await dataSources.fileSystemAPI.checkUserAccess(
        destinationEntry.id, 
        user.id, 
        'WRITE'
      );
      
      if (!hasDestAccess && destinationEntry.ownerId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('You do not have permission to write to the destination directory', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Check if a file with the same name already exists in the destination
      const newPath = `${destinationPath === '/' ? '' : destinationPath}/${entry.name}`;
      const existingEntry = await dataSources.fileSystemAPI.getFileByPath(newPath);
      
      if (existingEntry) {
        throw new GraphQLError('A file or directory with the same name already exists in the destination', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      // Move the entry
      const movedEntry = await dataSources.fileSystemAPI.moveEntry(id, {
        destinationPath: newPath,
        parentId: destinationEntry.id,
      });
      
      // Publish file system update events for both old and new locations
      dataSources.pubsub.publish(`FILE_SYSTEM_UPDATED:${entry.path.substring(0, entry.path.lastIndexOf('/'))}`, {
        fileSystemUpdated: entry,
      });
      
      dataSources.pubsub.publish(`FILE_SYSTEM_UPDATED:${destinationPath}`, {
        fileSystemUpdated: movedEntry,
      });
      
      return movedEntry;
    },
    
    deleteEntry: async (_, { id }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to delete files', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const entry = await dataSources.fileSystemAPI.getFileById(id);
      
      if (!entry) {
        throw new GraphQLError('File or directory not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user has write access or is admin or owner
      const hasAccess = await dataSources.fileSystemAPI.checkUserAccess(
        entry.id, 
        user.id, 
        'WRITE'
      );
      
      if (!hasAccess && entry.ownerId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('You do not have permission to delete this entry', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // If directory, make sure it's empty
      if (entry.type === 'DIRECTORY') {
        const { entries } = await dataSources.fileSystemAPI.getEntries({
          parentId: entry.id,
          first: 1,
        });
        
        if (entries.length > 0) {
          throw new GraphQLError('Cannot delete non-empty directory', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
      }
      
      // Delete the entry
      await dataSources.fileSystemAPI.deleteEntry(id);
      
      // Publish file system update event
      const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
      dataSources.pubsub.publish(`FILE_SYSTEM_UPDATED:${parentPath || '/'}`, {
        fileSystemUpdated: {
          ...entry,
          deleted: true,
        },
      });
      
      return true;
    },
    
    renameEntry: async (_, { id, newName }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to rename files', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Sanitize new name
      const sanitizedName = newName.replace(/[\/\\:*?"<>|]/g, '_');
      
      if (sanitizedName !== newName) {
        throw new GraphQLError('New name contains invalid characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      const entry = await dataSources.fileSystemAPI.getFileById(id);
      
      if (!entry) {
        throw new GraphQLError('File or directory not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if user has write access
      const hasAccess = await dataSources.fileSystemAPI.checkUserAccess(
        entry.id, 
        user.id, 
        'WRITE'
      );
      
      if (!hasAccess && entry.ownerId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('You do not have permission to rename this entry', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Get parent path
      const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
      
      // Check if a file with the new name already exists
      const newPath = `${parentPath === '' ? '/' : parentPath}/${sanitizedName}`;
      const existingEntry = await dataSources.fileSystemAPI.getFileByPath(newPath);
      
      if (existingEntry) {
        throw new GraphQLError('A file or directory with this name already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      // Rename the entry
      const renamedEntry = await dataSources.fileSystemAPI.renameEntry(id, {
        name: sanitizedName,
        path: newPath,
      });
      
      // Publish file system update event
      dataSources.pubsub.publish(`FILE_SYSTEM_UPDATED:${parentPath || '/'}`, {
        fileSystemUpdated: renamedEntry,
      });
      
      return renamedEntry;
    },
    
    updatePermissions: async (_, { entryId, userId, permission }, { dataSources, user }) => {
      if (!user) {
        throw new GraphQLError('You must be logged in to update permissions', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const entry = await dataSources.fileSystemAPI.getFileById(entryId);
      
      if (!entry) {
        throw new GraphQLError('File or directory not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Only owner or admin can update permissions
      if (entry.ownerId !== user.id && user.role !== 'ADMIN') {
        throw new GraphQLError('Only the owner can modify permissions', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Check if target user exists
      const targetUser = await dataSources.userAPI.getUserById(userId);
      
      if (!targetUser) {
        throw new GraphQLError('Target user not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Create or update permission
      const filePermission = await dataSources.fileSystemAPI.setPermission({
        entryId,
        userId,
        permission,
      });
      
      return filePermission;
    },
  },
  
  Subscription: {
    fileSystemUpdated: {
      subscribe: (_, { path }, { user, dataSources }) => {
        if (!user) {
          throw new GraphQLError('You must be logged in to subscribe to file system updates', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        const topic = path 
          ? `FILE_SYSTEM_UPDATED:${path}`
          : `FILE_SYSTEM_UPDATED:${user.id}`;
        
        return dataSources.pubsub.asyncIterator(topic);
      },
    },
  },
  
  FileSystemEntry: {
    owner: async (parent, _, { dataSources }) => {
      if (parent.owner) {
        return parent.owner;
      }
      
      return dataSources.userAPI.getUserById(parent.ownerId);
    },
    
    parent: async (parent, _, { dataSources }) => {
      if (!parent.parentId) {
        return null;
      }
      
      if (parent.parent) {
        return parent.parent;
      }
      
      return dataSources.fileSystemAPI.getFileById(parent.parentId);
    },
    
    children: async (parent, { first = 20, after }, { dataSources }) => {
      if (parent.type !== 'DIRECTORY') {
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        };
      }
      
      const { entries, hasNextPage, endCursor, totalCount } = await dataSources.fileSystemAPI.getEntries({
        parentId: parent.id,
        first,
        after,
      });
      
      return {
        edges: entries.map(entry => ({
          cursor: entry.id,
          node: entry,
        })),
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: entries.length > 0 ? entries[0].id : null,
          endCursor,
        },
        totalCount,
      };
    },
    
    permissions: async (parent, _, { dataSources }) => {
      return dataSources.fileSystemAPI.getPermissionsByEntryId(parent.id);
    },
    
    metadata: async (parent, _, { dataSources }) => {
      return dataSources.fileSystemAPI.getFileMetadata(parent.id);
    },
    
    versions: async (parent, _, { dataSources }) => {
      if (parent.type !== 'FILE') {
        return [];
      }
      
      return dataSources.fileSystemAPI.getFileVersions(parent.id);
    },
  },
};