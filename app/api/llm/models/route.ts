import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getProviderApiKey, getProviderBaseUrl } from '@/lib/env-config';

export async function GET(request: NextRequest) {
  console.log('🚀 LOCAL MODELS API CALLED - This is running on localhost:3000');
  console.log('📍 Request URL:', request.url);
  console.log('📍 Request headers:', Object.fromEntries(request.headers.entries()));

  const session = await getServerSession(authOptions);

  console.log('🔐 Session check:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userEmail: session?.user?.email
  });

  if (!session || !session.user) {
    console.log('❌ Unauthorized access to models API');
    return NextResponse.json({
      message: 'Unauthorized',
      debug: {
        hasSession: !!session,
        hasUser: !!session?.user
      }
    }, { status: 401 });
  }

  console.log('✅ Authorized user:', session.user.email);

  try {
    const apiKey = getProviderApiKey('openai-compatible');
    const baseUrl = getProviderBaseUrl('openai-compatible');

    console.log('🔧 Environment check:');
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('Base URL:', baseUrl);
    console.log('Raw env vars:', {
      apiKey: process.env.NEXT_PUBLIC_OPENAI_COMPATIBLE_API_KEY ? 'SET' : 'NOT SET',
      baseUrl: process.env.NEXT_PUBLIC_OPENAI_COMPATIBLE_BASE_URL
    });

    if (!apiKey || !baseUrl) {
      return NextResponse.json({
        message: 'API configuration not found',
        debug: {
          apiKey: !!apiKey,
          baseUrl: baseUrl,
          envApiKey: !!process.env.NEXT_PUBLIC_OPENAI_COMPATIBLE_API_KEY,
          envBaseUrl: process.env.NEXT_PUBLIC_OPENAI_COMPATIBLE_BASE_URL
        }
      }, { status: 500 });
    }

    console.log('Fetching models from:', `${baseUrl}/models`);

    // Temporarily disable SSL verification for development
    if (process.env.NODE_ENV === 'development') {
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    }

    // Fetch models from your external API
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // Add timeout and better error handling
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error('Models API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);

      return NextResponse.json({
        message: 'Failed to fetch models from external API',
        error: `${response.status}: ${errorText}`,
        data: []
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Models API response:', data);

    // Transform the response to include additional metadata
    const enhancedModels = data.data?.map((model: any) => {
      // Extract model info and add capabilities based on model name
      const modelName = model.id || model.name || 'Unknown Model';
      const capabilities = [];
      let category = 'text'; // Default category

      // Determine category and capabilities based on model name/id
      if (modelName.toLowerCase().includes('dall-e') ||
          modelName.toLowerCase().includes('midjourney') ||
          modelName.toLowerCase().includes('stable-diffusion') ||
          modelName.toLowerCase().includes('imagen')) {
        category = 'image';
        capabilities.push('image-generation', 'creative');
      } else if (modelName.toLowerCase().includes('whisper') ||
                 modelName.toLowerCase().includes('speech') ||
                 modelName.toLowerCase().includes('audio')) {
        category = 'audio';
        capabilities.push('speech-to-text', 'audio-processing');
      } else if (modelName.toLowerCase().includes('tts') ||
                 modelName.toLowerCase().includes('voice')) {
        category = 'audio';
        capabilities.push('text-to-speech', 'voice-synthesis');
      } else if (modelName.toLowerCase().includes('embedding') ||
                 modelName.toLowerCase().includes('ada')) {
        category = 'embedding';
        capabilities.push('embeddings', 'similarity');
      } else {
        // Text models (default)
        category = 'text';

        if (modelName.toLowerCase().includes('gemini')) {
          capabilities.push('text', 'vision', 'reasoning', 'web', 'streaming', 'multimodal');
        } else if (modelName.toLowerCase().includes('gpt')) {
          capabilities.push('text', 'reasoning', 'streaming');
          if (modelName.includes('4') || modelName.includes('vision')) {
            capabilities.push('vision', 'multimodal');
          }
        } else if (modelName.toLowerCase().includes('claude')) {
          capabilities.push('text', 'reasoning', 'analysis', 'streaming');
          if (modelName.includes('3')) {
            capabilities.push('vision', 'multimodal');
          }
        } else if (modelName.toLowerCase().includes('o3')) {
          // o3 models don't support streaming based on your testing
          capabilities.push('text', 'reasoning', 'advanced-reasoning');
        } else {
          capabilities.push('text');
        }
      }

      // Determine if model is fast based on name
      const isFast = modelName.toLowerCase().includes('flash') ||
                    modelName.toLowerCase().includes('turbo') ||
                    modelName.toLowerCase().includes('mini');

      if (isFast) {
        capabilities.push('fast');
      }

      return {
        id: model.id,
        object: model.object || 'model',
        created: model.created || Date.now(),
        owned_by: model.owned_by || 'unknown',
        name: modelName,
        description: model.description || `${modelName} - AI ${category} model`,
        context_length: model.context_length || 128000,
        category, // Add category field
        capabilities,
        available: true,
        // Add UI-specific properties
        badge: isFast ? { text: 'FAST', type: 'fast' } :
               category === 'image' ? { text: 'IMAGE', type: 'new' } :
               category === 'audio' ? { text: 'AUDIO', type: 'new' } :
               undefined,
        features: capabilities,
        favorite: modelName.toLowerCase().includes('gemini'), // Default favorites
        provider: model.owned_by || 'unknown'
      };
    }) || [];

    return NextResponse.json({
      data: enhancedModels,
      object: 'list',
      cached: false,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching models:', error);

    return NextResponse.json({
      message: 'Failed to fetch models',
      error: error instanceof Error ? error.message : 'Network error',
      data: []
    }, { status: 500 });
  }
}
