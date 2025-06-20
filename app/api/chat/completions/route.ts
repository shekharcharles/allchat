import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getProviderApiKey, getProviderBaseUrl, getProviderDefaultModel } from '@/lib/env-config';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messages, model, stream = true } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ message: 'Messages are required' }, { status: 400 });
    }

    const apiKey = getProviderApiKey('openai-compatible');
    const baseUrl = getProviderBaseUrl('openai-compatible');
    const defaultModel = getProviderDefaultModel('openai-compatible');

    if (!apiKey || !baseUrl) {
      return NextResponse.json({
        message: 'OpenAI-compatible API not configured properly'
      }, { status: 500 });
    }

    // Determine the model to use, prioritizing the one from the request, then default
    const selectedModel = model || defaultModel;

    console.log('🚀 Chat completion request:', {
      requestedModel: model,
      defaultModel,
      selectedModel,
      baseUrl,
      messagesCount: messages.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      streamingRequested: stream,
      modelSupportsStreaming: !selectedModel.toLowerCase().includes('o3'),
      shouldStream: stream && !selectedModel.toLowerCase().includes('o3'),
    });

    // Check if the model supports streaming
    const modelSupportsStreaming = !selectedModel.toLowerCase().includes('o3');
    const shouldStream = stream && modelSupportsStreaming;

    if (stream && !modelSupportsStreaming) {
      console.log(`⚠️  Model ${selectedModel} does not support streaming, falling back to non-streaming mode`);
    }

    // Add system message for better formatting if not already present
    const hasSystemMessage = messages.some((msg: any) => msg.role === 'system');
    const enhancedMessages = hasSystemMessage ? messages : [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Please format your responses using proper markdown syntax including:\n- Use **bold** for emphasis\n- Use bullet points and numbered lists when appropriate\n- Use proper line breaks between paragraphs\n- Use code blocks for code examples\n- Use headers (##) for sections when relevant\n- Make your responses well-structured and easy to read'
      },
      ...messages
    ];

    // Prepare the request to your external API
    const apiRequest = {
      model: selectedModel,
      messages: enhancedMessages,
      stream: shouldStream,
      temperature: 0.7,
      max_tokens: 2048,
    };

    console.log('Making request to:', `${baseUrl}/chat/completions`);
    console.log('Request payload:', JSON.stringify(apiRequest, null, 2));

    // Make request to your external API
    // Temporarily disable SSL verification for development
    if (process.env.NODE_ENV === 'development') {
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(apiRequest),
    });

    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response status:', response.status);
    console.log('Response content-type:', response.headers.get('content-type'));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    // If streaming is requested and supported, pass through the real stream
    if (shouldStream) {
      console.log('🌊 Streaming response detected, passing through real stream...');
      console.log('Response body type:', typeof response.body);
      console.log('Response body readable:', response.body ? 'yes' : 'no');

      // Check if the response is actually streaming (SSE format)
      const contentType = response.headers.get('content-type') || '';
      const isStreamingResponse = contentType.includes('text/event-stream') || contentType.includes('text/plain') || contentType.includes('application/json');

      console.log('🔍 Response analysis:', {
        contentType,
        isStreamingResponse,
        hasBody: !!response.body,
        status: response.status
      });

      if (isStreamingResponse && response.body) {
        console.log('✅ Real streaming response detected, passing through...');
        // Pass through the real streaming response
        return new NextResponse(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } else {
        console.log('⚠️ Non-streaming response received, converting to stream...');
        // If the external API doesn't support streaming, convert the response to a stream
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        const readable = new ReadableStream({
          async start(controller) {
            try {
              if (content) {
                // Stream the content word by word for better UX
                const words = content.split(' ');

                for (let i = 0; i < words.length; i++) {
                  const chunk = {
                    id: `chatcmpl-${Date.now()}`,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: selectedModel,
                    choices: [{
                      index: 0,
                      delta: {
                        content: (i === 0 ? '' : ' ') + words[i]
                      },
                      finish_reason: null
                    }]
                  };

                  controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);

                  // Add a small delay for better streaming effect
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              }

              // Send final chunk
              const finalChunk = {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: selectedModel,
                choices: [{
                  index: 0,
                  delta: {},
                  finish_reason: 'stop'
                }]
              };

              controller.enqueue(`data: ${JSON.stringify(finalChunk)}\n\n`);
              controller.enqueue('data: [DONE]\n\n');
              controller.close();

            } catch (error) {
              console.error('Streaming error:', error);
              controller.error(error);
            }
          }
        });

        return new NextResponse(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
    } else {
      // For non-streaming, return the JSON response
      console.log('📄 Non-streaming response, parsing JSON...');
      const data = await response.json();
      return NextResponse.json(data);
    }

  } catch (error) {
    console.error('Error in chat completions API:', error);
    return NextResponse.json({
      message: 'Error processing chat completion',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
