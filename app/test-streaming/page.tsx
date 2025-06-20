"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, AlertCircle, CheckCircle } from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  provider: string;
  capabilities: string[];
  features: string[];
  available: boolean;
  supportsStreaming?: boolean;
}

export default function TestStreamingPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/llm/models');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      
      // Add streaming support detection
      const modelsWithStreaming = data.map((model: ModelInfo) => ({
        ...model,
        supportsStreaming: model.capabilities?.includes('streaming') || 
                          !model.id.toLowerCase().includes('o3')
      }));
      
      setModels(modelsWithStreaming);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models');
    } finally {
      setIsLoading(false);
    }
  };

  const testStreaming = async (modelId: string) => {
    try {
      console.log(`Testing streaming for model: ${modelId}`);
      
      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'user', content: 'Say hello and count to 5.' }
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log(`✅ Streaming test successful for ${modelId}`);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Read a bit of the stream to verify it's working
      const reader = response.body?.getReader();
      if (reader) {
        const { value } = await reader.read();
        const chunk = new TextDecoder().decode(value);
        console.log('First chunk:', chunk);
        reader.releaseLock();
      }
      
    } catch (err) {
      console.error(`❌ Streaming test failed for ${modelId}:`, err);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Model Streaming Test</h1>
        <p className="text-muted-foreground">
          Test which models support streaming responses. Based on your testing:
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">gpt-4o: Supports streaming</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">o3: Does not support streaming</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <Card key={model.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{model.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{model.provider}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {model.supportsStreaming ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Zap className="h-3 w-3 mr-1" />
                      Streaming
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      No Streaming
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {model.description && (
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {model.capabilities?.slice(0, 4).map((capability) => (
                    <Badge key={capability} variant="secondary" className="text-xs">
                      {capability}
                    </Badge>
                  ))}
                  {model.capabilities && model.capabilities.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{model.capabilities.length - 4}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Badge variant={model.available ? "default" : "secondary"}>
                    {model.available ? "Available" : "Unavailable"}
                  </Badge>
                  
                  {model.available && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testStreaming(model.id)}
                      className="text-xs"
                    >
                      Test Stream
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Test Stream" on any available model</li>
              <li>Open browser developer tools (F12) and check the Console tab</li>
              <li>Look for streaming test results and response details</li>
              <li>Models with streaming support will show successful stream responses</li>
              <li>Models without streaming will fall back to non-streaming mode</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
