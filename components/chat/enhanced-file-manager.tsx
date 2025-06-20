"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Video, 
  Music, 
  Archive, 
  Code,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  Grid3X3,
  List,
  X,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface FileData {
  id: string;
  gridFSId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  result?: FileData;
}

interface EnhancedFileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect?: (file: FileData) => void;
  allowMultiple?: boolean;
  fileFilter?: string; // 'image', 'document', 'video', 'audio', etc.
}

const FILE_TYPE_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  archive: Archive,
  code: Code,
  default: File
};

const FILE_TYPE_COLORS = {
  image: 'text-green-600 bg-green-50 border-green-200',
  video: 'text-purple-600 bg-purple-50 border-purple-200',
  audio: 'text-blue-600 bg-blue-50 border-blue-200',
  document: 'text-red-600 bg-red-50 border-red-200',
  archive: 'text-orange-600 bg-orange-50 border-orange-200',
  code: 'text-gray-600 bg-gray-50 border-gray-200',
  default: 'text-gray-600 bg-gray-50 border-gray-200'
};

export function EnhancedFileManager({ 
  isOpen, 
  onClose, 
  onFileSelect,
  allowMultiple = false,
  fileFilter 
}: EnhancedFileManagerProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/files/upload');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else {
        throw new Error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Filter files based on search and type
  useEffect(() => {
    let filtered = files;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.mimeType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(file => {
        const type = getFileType(file.mimeType);
        return type === selectedType;
      });
    }

    // Apply file filter prop
    if (fileFilter) {
      filtered = filtered.filter(file => {
        const type = getFileType(file.mimeType);
        return type === fileFilter;
      });
    }

    setFilteredFiles(filtered);
  }, [files, searchQuery, selectedType, fileFilter]);

  // Load files when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen, fetchFiles]);

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('xml')) return 'code';
    return 'default';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (files: FileList) => {
    const newUploads = new Map(uploadProgress);

    for (const file of Array.from(files)) {
      const uploadId = `${file.name}-${Date.now()}`;
      newUploads.set(uploadId, {
        file,
        progress: 0,
        status: 'uploading'
      });
    }

    setUploadProgress(newUploads);

    // Upload files one by one
    for (const file of Array.from(files)) {
      const uploadId = `${file.name}-${Date.now()}`;
      
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          newUploads.set(uploadId, {
            file,
            progress: 100,
            status: 'completed',
            result
          });
          
          // Add to files list
          setFiles(prev => [result, ...prev]);
          
          toast({
            title: "Success",
            description: `${file.name} uploaded successfully`,
          });
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }
      } catch (error) {
        newUploads.set(uploadId, {
          file,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
      
      setUploadProgress(new Map(newUploads));
    }

    // Clear completed uploads after 3 seconds
    setTimeout(() => {
      const filtered = new Map();
      newUploads.forEach((upload, id) => {
        if (upload.status === 'uploading') {
          filtered.set(id, upload);
        }
      });
      setUploadProgress(filtered);
    }, 3000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (file: FileData) => {
    if (allowMultiple) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        newSelected.add(file.id);
      }
      setSelectedFiles(newSelected);
    } else {
      onFileSelect?.(file);
      onClose();
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        toast({
          title: "Success",
          description: "File deleted successfully",
        });
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const getFileTypeIcon = (mimeType: string) => {
    const type = getFileType(mimeType);
    const IconComponent = FILE_TYPE_ICONS[type as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.default;
    return IconComponent;
  };

  const getFileTypeColor = (mimeType: string) => {
    const type = getFileType(mimeType);
    return FILE_TYPE_COLORS[type as keyof typeof FILE_TYPE_COLORS] || FILE_TYPE_COLORS.default;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Paperclip className="h-5 w-5" />
            <span>File Manager</span>
          </DialogTitle>
          <DialogDescription>
            Upload, manage, and select files for your conversations
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files">My Files</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop files here, or click to select
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileUpload(e.target.files);
                  }
                }}
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Select Files
                </label>
              </Button>
            </div>

            {/* Upload Progress */}
            {uploadProgress.size > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Upload Progress</h4>
                {Array.from(uploadProgress.entries()).map(([id, upload]) => (
                  <div key={id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{upload.file.name}</span>
                        <div className="flex items-center space-x-2">
                          {upload.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
                          {upload.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {upload.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        </div>
                      </div>
                      {upload.status === 'uploading' && (
                        <Progress value={upload.progress} className="h-2" />
                      )}
                      {upload.status === 'error' && (
                        <p className="text-xs text-red-500">{upload.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedType === 'all' ? 'All Types' : selectedType}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedType('all')}>
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedType('image')}>
                    Images
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('document')}>
                    Documents
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('video')}>
                    Videos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('audio')}>
                    Audio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('archive')}>
                    Archives
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('code')}>
                    Code
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>

            {/* Files Grid/List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading files...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No files found</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-2'}>
                  <AnimatePresence>
                    {filteredFiles.map((file) => {
                      const IconComponent = getFileTypeIcon(file.mimeType);
                      const colorClass = getFileTypeColor(file.mimeType);
                      const isSelected = selectedFiles.has(file.id);

                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.02 }}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                          onClick={() => handleFileSelect(file)}
                        >
                          <div className={viewMode === 'grid' ? 'text-center' : 'flex items-center space-x-3'}>
                            <div className={`${viewMode === 'grid' ? 'mx-auto mb-2' : ''} w-10 h-10 rounded-lg border flex items-center justify-center ${colorClass}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            
                            <div className={viewMode === 'grid' ? '' : 'flex-1 min-w-0'}>
                              <h4 className="font-medium text-sm truncate" title={file.originalName}>
                                {file.originalName}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>

                            {viewMode === 'list' && (
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(file.url, '_blank');
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/api/files/download/${file.gridFSId}`, '_blank');
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(file.id);
                                  }}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Selection Actions */}
            {allowMultiple && selectedFiles.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">
                  {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFiles(new Set())}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const selectedFileData = files.filter(f => selectedFiles.has(f.id));
                      selectedFileData.forEach(file => onFileSelect?.(file));
                      onClose();
                    }}
                  >
                    Use Selected
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
