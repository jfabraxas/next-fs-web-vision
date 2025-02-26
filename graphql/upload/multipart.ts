import { ReadStream } from 'fs';
import { FileUpload } from 'graphql-upload-minimal';

// Utility type for file uploads
export interface UploadedFile {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => ReadStream;
  size: number;
}

// Process uploaded file and return metadata
export async function processUploadedFile(upload: Promise<FileUpload>): Promise<UploadedFile> {
  try {
    const { filename, mimetype, encoding, createReadStream } = await upload;
    
    // Get file size by consuming the stream
    const chunks: Buffer[] = [];
    const stream = createReadStream();
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const size = buffer.length;
        
        resolve({
          filename,
          mimetype,
          encoding,
          size,
          createReadStream: () => {
            // Return a new stream from the buffer
            const { Readable } = require('stream');
            return new Readable({
              read() {
                this.push(buffer);
                this.push(null);
              }
            });
          }
        });
      });
      
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    throw new Error('File upload processing failed');
  }
}

// Save file to storage
export async function saveFile(
  file: UploadedFile, 
  destination: string,
  options = { overwrite: false }
): Promise<string> {
  try {
    // Implementation would typically save to filesystem or cloud storage
    console.log(`Saving file ${file.filename} to ${destination}`);
    
    // Simulate file saving
    return `${destination}/${file.filename}`;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save file');
  }
}