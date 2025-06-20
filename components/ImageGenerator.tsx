'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Copy, Wand2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedImage {
  url: string;
  revised_prompt?: string;
}

interface ImageModel {
  id: string;
  name: string;
  description: string;
  category: string;
  maxSize: string;
}

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
}

export default function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('dall-e-3');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [availableModels, setAvailableModels] = useState<ImageModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const { toast } = useToast();

  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('/api/images/generate');
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models || []);
        }
      } catch (error) {
        console.error('Failed to load image models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for image generation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          size,
          n: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.images && data.images.length > 0) {
        setGeneratedImages(data.images);
        toast({
          title: "Success!",
          description: "Image generated successfully",
        });

        // Call the callback if provided
        if (onImageGenerated && data.images[0]?.url) {
          onImageGenerated(data.images[0].url, prompt);
        }
      } else {
        throw new Error('No images returned from API');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Downloaded!",
        description: "Image saved to your downloads folder",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = async (imageUrl: string) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast({
        title: "Copied!",
        description: "Image URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Input
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={setModel} disabled={isLoadingModels}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select model"} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((modelOption) => (
                    <SelectItem key={modelOption.id} value={modelOption.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          <span className="font-medium">{modelOption.name}</span>
                          <span className="text-xs text-muted-foreground">{modelOption.description}</span>
                        </div>
                        <Badge variant={modelOption.category === 'Premium' ? 'default' : 'secondary'} className="ml-2">
                          {modelOption.category === 'Premium' ? (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              Pro
                            </>
                          ) : (
                            'Standard'
                          )}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512x512">512×512</SelectItem>
                  <SelectItem value="768x768">768×768</SelectItem>
                  <SelectItem value="1024x1024">1024×1024</SelectItem>
                  <SelectItem value="1024x1792">1024×1792 (Portrait)</SelectItem>
                  <SelectItem value="1792x1024">1792×1024 (Landscape)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="space-y-2">
                  <div className="relative group">
                    <img
                      src={image.url}
                      alt={`Generated image ${index + 1}`}
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopyUrl(image.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(image.url, index)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {image.revised_prompt && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Revised prompt:</strong> {image.revised_prompt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
