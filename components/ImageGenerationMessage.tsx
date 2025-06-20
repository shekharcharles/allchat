'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Copy, RefreshCw, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageGenerationMessageProps {
  prompt: string;
  model?: string;
  onImageGenerated?: (imageUrl: string) => void;
}

export default function ImageGenerationMessage({ 
  prompt, 
  model = 'dall-e-3',
  onImageGenerated 
}: ImageGenerationMessageProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateImage = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model,
          size: '1024x1024',
          n: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.images && data.images.length > 0) {
        const imageUrl = data.images[0].url;
        setGeneratedImage(imageUrl);
        onImageGenerated?.(imageUrl);
        toast({
          title: "Success!",
          description: "Image generated successfully",
        });
      } else {
        throw new Error('No images returned from API');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
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

  const handleCopyUrl = async () => {
    if (!generatedImage) return;
    
    try {
      await navigator.clipboard.writeText(generatedImage);
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

  // Auto-generate on mount
  React.useEffect(() => {
    generateImage();
  }, []);

  return (
    <Card className="max-w-md">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Image Generation</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {model}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <strong>Prompt:</strong> {prompt}
          </div>

          {isGenerating && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Generating image...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <p className="text-sm text-destructive mb-2">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={generateImage}
                disabled={isGenerating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {generatedImage && (
            <div className="space-y-3">
              <div className="relative group">
                <img
                  src={generatedImage}
                  alt={`Generated image: ${prompt}`}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCopyUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateImage}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
