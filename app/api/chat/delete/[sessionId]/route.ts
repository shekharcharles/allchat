import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma'; // Assuming prisma client is initialized here

export async function DELETE(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params; // Destructure sessionId before any async operations

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  if (!sessionId) {
    return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
  }

  try {
    // Verify ownership of the chat session before deleting
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

    // Delete the chat session. Due to onDelete: Cascade in schema.prisma,
    // associated ChatMessages will also be deleted automatically.
    await prisma.chatSession.delete({
      where: {
        id: sessionId,
      },
    });

    return NextResponse.json({ message: 'Chat session deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json({
      message: 'Error deleting chat session',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}