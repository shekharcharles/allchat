import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params; // Destructure sessionId before any async operations

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const body = await request.json();
  const { title } = body;

  if (!sessionId || !title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ message: 'Session ID and a valid title are required' }, { status: 400 });
  }

  try {
    // Verify ownership of the chat session before renaming
    const chatSession = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!chatSession) {
      return NextResponse.json({ message: 'Chat session not found' }, { status: 404 });
    }

    if (chatSession.userId !== userId) {
      return NextResponse.json({ message: 'Forbidden: You do not own this chat session' }, { status: 403 });
    }

    const updatedSession = await prisma.chatSession.update({
      where: {
        id: sessionId,
      },
      data: {
        title: title.trim(),
      },
    });

    return NextResponse.json({ message: 'Chat session renamed successfully', session: updatedSession }, { status: 200 });

  } catch (error) {
    console.error('Error renaming chat session:', error);
    return NextResponse.json({
      message: 'Error renaming chat session',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}