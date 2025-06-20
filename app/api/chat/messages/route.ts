import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma'; // Import Prisma client
import { generateSmartTitle, isValidTitle } from '@/lib/chat-title-generator';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { content, role, sessionId: requestedSessionId, provider, model } = await request.json();

    if (!content || !role) {
      return NextResponse.json({ message: 'Missing content or role' }, { status: 400 });
    }

    if (role !== 'USER' && role !== 'ASSISTANT') {
      return NextResponse.json({ message: 'Invalid role specified' }, { status: 400 });
    }

    let currentSessionId = requestedSessionId;

    // Only create a new session if explicitly requested with 'new' or if no sessionId provided
    if (!currentSessionId || currentSessionId === 'new') {
      const newChatSession = await prisma.chatSession.create({
        data: {
          userId: userId,
          title: 'New Chat',
          provider: provider || 'openai',
          model: model || 'gpt-4o-mini',
          messageCount: 0,
        },
      });
      currentSessionId = newChatSession.id;
    } else {
      const chatSession = await prisma.chatSession.findUnique({
        where: {
          id: currentSessionId,
        },
      });

      if (!chatSession || chatSession.userId !== userId) {
        return NextResponse.json({ message: 'Invalid or unauthorized sessionId' }, { status: 403 });
      }
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        content,
        role: role.toLowerCase() as 'user' | 'assistant',
        userId: userId,
        sessionId: currentSessionId,
        provider: provider || 'openai',
        model: model || 'gpt-4o-mini',
      },
    });

    const updatedSession = await prisma.chatSession.update({
      where: { id: currentSessionId },
      data: {
        messageCount: {
          increment: 1,
        },
        updatedAt: new Date(),
        lastProvider: provider || 'openai',
        lastModel: model || 'gpt-4o-mini',
      },
    });

    // Auto-generate title if this is the first user message and title is still "New Chat"
    if (role.toLowerCase() === 'user' && updatedSession.messageCount <= 2 && updatedSession.title === 'New Chat') {
      try {
        // Get the first few messages to generate a title
        const recentMessages = await prisma.chatMessage.findMany({
          where: {
            sessionId: currentSessionId,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 3,
          select: {
            content: true,
            role: true,
          },
        });

        const messagesForTitle = recentMessages.map(msg => ({
          content: msg.content,
          role: msg.role.toLowerCase() as 'user' | 'assistant',
        }));

        const generatedTitle = generateSmartTitle(messagesForTitle);

        if (isValidTitle(generatedTitle) && generatedTitle !== 'New Chat') {
          await prisma.chatSession.update({
            where: { id: currentSessionId },
            data: { title: generatedTitle },
          });
        }
      } catch (titleError) {
        // Don't fail the message save if title generation fails
        console.warn('Failed to generate title:', titleError);
      }
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json({ message: 'Error saving message' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);

  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ message: 'sessionId is required' }, { status: 400 });
  }

  try {
    const chatSession = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId: userId,
      },
    });

    if (!chatSession) {
      return NextResponse.json({ message: 'Invalid or unauthorized sessionId' }, { status: 403 });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const skip = (page - 1) * pageSize;

    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: userId,
        sessionId: sessionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      skip: skip,
      take: pageSize,
    });

    const totalMessages = await prisma.chatMessage.count({
      where: {
        userId: userId,
        sessionId: sessionId,
      },
    });

    const totalPages = Math.ceil(totalMessages / pageSize);

    return NextResponse.json({
      messages: messages,
      currentPage: page,
      totalPages,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ message: 'Error fetching messages' }, { status: 500 });
  }
}
