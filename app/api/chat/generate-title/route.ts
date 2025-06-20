import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { generateSmartTitle, generateTitleSuggestions, isValidTitle } from '@/lib/chat-title-generator';

// POST - Generate title for a conversation
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { sessionId, messages, autoUpdate = false } = body;

    if (!sessionId) {
      return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
    }

    // Verify ownership of the chat session
    const chatSession = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId: userId,
      },
    });

    if (!chatSession) {
      return NextResponse.json({ message: 'Chat session not found or unauthorized' }, { status: 404 });
    }

    let messagesToAnalyze = messages;

    // If messages not provided, fetch from database
    if (!messagesToAnalyze) {
      const dbMessages = await prisma.chatMessage.findMany({
        where: {
          sessionId: sessionId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          content: true,
          role: true,
        },
        take: 5, // Only analyze first 5 messages for title generation
      });

      messagesToAnalyze = dbMessages.map(msg => ({
        content: msg.content,
        role: msg.role.toLowerCase() as 'user' | 'assistant',
      }));
    }

    // Generate title and suggestions
    const generatedTitle = generateSmartTitle(messagesToAnalyze);
    const suggestions = generateTitleSuggestions(messagesToAnalyze);

    // Auto-update the title if requested and it's currently "New Chat"
    if (autoUpdate && (chatSession.title === 'New Chat' || chatSession.title.startsWith('New Chat'))) {
      if (isValidTitle(generatedTitle)) {
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { title: generatedTitle },
        });
      }
    }

    return NextResponse.json({
      generatedTitle,
      suggestions,
      currentTitle: chatSession.title,
      autoUpdated: autoUpdate && isValidTitle(generatedTitle),
    }, { status: 200 });

  } catch (error) {
    console.error('Error generating chat title:', error);
    return NextResponse.json({ 
      message: 'Error generating chat title',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update chat title
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { sessionId, title } = body;

    if (!sessionId || !title) {
      return NextResponse.json({ message: 'Session ID and title are required' }, { status: 400 });
    }

    if (!isValidTitle(title)) {
      return NextResponse.json({ message: 'Invalid title format' }, { status: 400 });
    }

    // Verify ownership of the chat session
    const chatSession = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId: userId,
      },
    });

    if (!chatSession) {
      return NextResponse.json({ message: 'Chat session not found or unauthorized' }, { status: 404 });
    }

    // Update the title
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: title.trim() },
    });

    return NextResponse.json({
      message: 'Title updated successfully',
      title: updatedSession.title,
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating chat title:', error);
    return NextResponse.json({ 
      message: 'Error updating chat title',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
