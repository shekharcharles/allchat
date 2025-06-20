"use client";

import React, { useRef, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizonalIcon, PaperclipIcon, XIcon, Loader2, Zap } from 'lucide-react';
import { EnhancedModelSelector } from '@/components/chat/enhanced-model-selector';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  isUploadingFile: boolean;
  disabled?: boolean;
  isStreaming?: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  selectedFile,
  setSelectedFile,
  selectedModel,
  onModelChange,
  isUploadingFile,
  disabled = false,
  isStreaming = false
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/30 p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const MAX_FILE_SIZE_MB = 5;
                const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'text/markdown'];

                if (!allowedTypes.includes(file.type)) {
                  alert(`Unsupported file type: ${file.type}. Please upload an image (JPG, PNG, GIF), PDF, TXT, or MD file.`);
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  return;
                }

                if (file.size > MAX_FILE_SIZE_BYTES) {
                  alert(`File size exceeds limit. Max allowed is ${MAX_FILE_SIZE_MB}MB.`);
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  return;
                }

                setSelectedFile(file);
              } else {
                setSelectedFile(null);
              }
            }}
            accept="image/jpeg,image/png,image/gif,application/pdf,text/plain,text/markdown"
          />

          {/* File attachment preview */}
          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="p-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <PaperclipIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRemoveSelectedFile}
                    className="w-8 h-8 bg-destructive/10 hover:bg-destructive/20 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <XIcon className="h-4 w-4 text-destructive" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Model selector row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <EnhancedModelSelector
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                disabled={disabled || isLoading}
              />

              {/* Streaming indicator */}
              {selectedModel && !selectedModel.toLowerCase().includes('o3') && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                    isStreaming
                      ? 'text-blue-600 bg-blue-50 border-blue-200 animate-pulse'
                      : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <Zap className="h-3 w-3" />
                  <span>{isStreaming ? 'Streaming...' : 'Streaming'}</span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:flex items-center space-x-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full"
              >
                <span>Quick switch:</span>
                <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-xs">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-xs">K</kbd>
              </motion.div>
            </div>
            <AnimatePresence>
              {input.length > 6400 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full ${
                    input.length > 7600 ? 'bg-destructive/10 text-destructive' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  <span className="font-medium">{input.length}</span>
                  <span>/</span>
                  <span>8000</span>
                  {input.length > 7600 && <span className="text-xs">⚠️</span>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input container - floating card style */}
          <div className="relative">
            <div className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-xl focus-within:shadow-primary/10">
              <div className="flex items-center gap-2 p-4">
                {/* Attachment button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || disabled || isUploadingFile}
                  className="w-10 h-10 bg-muted/40 hover:bg-primary/10 rounded-2xl flex items-center justify-center transition-all duration-300 border border-border/20 hover:border-primary/30"
                  aria-label="Attach file"
                >
                  {isUploadingFile ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <PaperclipIcon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </motion.button>

                {/* Text input */}
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message here..."
                    disabled={isLoading || disabled}
                    className="w-full min-h-[24px] max-h-[200px] bg-transparent border-0 outline-none resize-none text-foreground placeholder:text-muted-foreground/50 text-base leading-6 font-medium"
                    style={{
                      height: 'auto',
                      fontSize: '16px',
                      lineHeight: '1.5'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      const newHeight = Math.min(Math.max(target.scrollHeight, 24), 200);
                      target.style.height = newHeight + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim() || selectedFile) {
                          handleSubmit(e as any);
                        }
                      }
                    }}
                    autoFocus
                    aria-label="Type your message"
                    role="textbox"
                    aria-multiline="true"
                  />
                </div>

                {/* Send button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || disabled || (!input.trim() && !selectedFile)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-primary hover:bg-primary/90 disabled:bg-muted/60 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:cursor-not-allowed disabled:shadow-none"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
                  ) : (
                    <SendHorizonalIcon className="h-5 w-5 text-primary-foreground" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Shortcuts and character count */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mt-3 px-4"
            >
              <div className="flex items-center space-x-4 text-xs text-muted-foreground/70">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-muted/30 rounded text-xs font-mono">Enter</kbd>
                  <span>to send</span>
                </div>
                <div className="hidden sm:flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-muted/30 rounded text-xs font-mono">Shift+Enter</kbd>
                  <span>for new line</span>
                </div>
              </div>

              {/* Character count */}
              <AnimatePresence>
                {input.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full transition-colors ${
                      input.length > 7600
                        ? 'text-destructive bg-destructive/10'
                        : input.length > 6400
                        ? 'text-yellow-600 bg-yellow-100'
                        : 'text-muted-foreground/70'
                    }`}
                  >
                    <span className="font-mono">{input.length.toLocaleString()}</span>
                    <span className="opacity-50">/</span>
                    <span className="font-mono text-primary/70">8,000</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}
