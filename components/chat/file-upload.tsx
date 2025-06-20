"use client";

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UploadIcon, 
  FileIcon, 
  ImageIcon, 
  FileTextIcon, 
  XIcon,
  CheckIcon,
  AlertCircleIcon,
  Loader2
} from 'lucide-react';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

interface FileUploadProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  onFileRemove: (fileId: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown'
];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (type === 'application/pdf') return <FileTextIcon className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
};

const getFileTypeColor = (type: string) => {
  if (type.startsWith('image/')) return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
  if (type === 'application/pdf') return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20';
  return 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20';
};

export default function FileUpload({
  onFilesSelected,
  onFileRemove,
  maxFiles = 5,
  maxFileSize = 10, // 10MB default
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const processFiles = useCallback(async (files: FileList) => {
    if (disabled) return;
    
    const fileArray = Array.from(files);
    const validFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      if (uploadedFiles.length + validFiles.length >= maxFiles) {
        break;
      }

      const error = validateFile(file);
      if (error) {
        // Could show toast notification here
        console.error(`File validation error: ${error}`);
        continue;
      }

      const preview = await createFilePreview(file);
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview,
        status: 'uploading',
        progress: 0,
      };

      validFiles.push(uploadedFile);
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      onFilesSelected(validFiles);
      
      // Simulate upload progress
      validFiles.forEach(uploadedFile => {
        simulateUpload(uploadedFile.id);
      });
    }
  }, [uploadedFiles.length, maxFiles, disabled, onFilesSelected]);

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadedFiles(prev => 
          prev.map(file => 
            file.id === fileId 
              ? { ...file, status: 'success', progress: 100 }
              : file
          )
        );
      } else {
        setUploadedFiles(prev => 
          prev.map(file => 
            file.id === fileId 
              ? { ...file, progress }
              : file
          )
        );
      }
    }, 200);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && e.target.files) {
      processFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  }, [disabled, processFiles]);

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    onFileRemove(fileId);
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${isDragOver 
            ? 'border-primary bg-primary/5 scale-105' 
            : 'border-border hover:border-primary/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <motion.div
            animate={{ scale: isDragOver ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <UploadIcon className={`h-8 w-8 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          </motion.div>
          
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse • Max {maxFiles} files • {maxFileSize}MB each
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports: Images, PDFs, Text files
            </p>
          </div>
        </div>
      </motion.div>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadedFiles.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
              >
                <Card className="p-3">
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-3">
                      {/* File Icon/Preview */}
                      <div className="flex-shrink-0">
                        {uploadedFile.preview ? (
                          <img
                            src={uploadedFile.preview}
                            alt={uploadedFile.file.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            {getFileIcon(uploadedFile.file.type)}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium truncate">
                            {uploadedFile.file.name}
                          </p>
                          <Badge variant="outline" className={getFileTypeColor(uploadedFile.file.type)}>
                            {uploadedFile.file.type.split('/')[1].toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                        
                        {/* Progress Bar */}
                        {uploadedFile.status === 'uploading' && (
                          <div className="mt-2">
                            <Progress value={uploadedFile.progress} className="h-1" />
                          </div>
                        )}
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center space-x-2">
                        {uploadedFile.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {uploadedFile.status === 'success' && (
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        )}
                        {uploadedFile.status === 'error' && (
                          <AlertCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(uploadedFile.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
