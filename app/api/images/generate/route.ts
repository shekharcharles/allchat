import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, model = 'dall-e-3', size = '1024x1024', quality = 'standard', n = 1 } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Validate model availability for Pro tier
    const availableModels = ['dall-e-3', 'kandinsky-3.1', 'playground-v2.5', 'sd3.5', 'recraft-v3'];
    if (!availableModels.includes(model)) {
      return NextResponse.json({
        error: `Model '${model}' is not available in your subscription tier. Available models: ${availableModels.join(', ')}`
      }, { status: 400 });
    }

    // Get API configuration from environment
    const apiKey = process.env.NEXT_PUBLIC_IMAGE_GENERATION_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_GENERATION_BASE_URL;

    if (!apiKey || !baseUrl) {
      return NextResponse.json({ 
        error: 'Image generation API not configured' 
      }, { status: 500 });
    }

    // Make request to image generation API
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        size,
        quality,
        n,
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      console.error('Image generation API error:', errorData);

      // Extract meaningful error message
      let errorMessage = 'Failed to generate image';
      if (typeof errorData === 'object' && errorData.error) {
        if (errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        }
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }

      return NextResponse.json({
        error: errorMessage,
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Return the generated images
    return NextResponse.json({
      success: true,
      images: data.data || data.images || [],
      model,
      prompt
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to list available image models
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return available image generation models for Pro tier
    const models = [
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        description: 'OpenAI\'s advanced image generation model',
        category: 'Available',
        maxSize: '1024x1024'
      },
      {
        id: 'kandinsky-3.1',
        name: 'Kandinsky 3.1',
        description: 'Russian-developed artistic image model',
        category: 'Available',
        maxSize: '1024x1024'
      },
      {
        id: 'playground-v2.5',
        name: 'Playground V2.5',
        description: 'Versatile image generation model',
        category: 'Available',
        maxSize: '1024x1024'
      },
      {
        id: 'sd3.5',
        name: 'Stable Diffusion 3.5',
        description: 'Latest Stable Diffusion model with improved quality',
        category: 'Available',
        maxSize: '1024x1024'
      },
      {
        id: 'recraft-v3',
        name: 'Recraft V3',
        description: 'High-quality artistic image generation',
        category: 'Available',
        maxSize: '1024x1024'
      }
    ];

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching image models:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch models' 
    }, { status: 500 });
  }
}
