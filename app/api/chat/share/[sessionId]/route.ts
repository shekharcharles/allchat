import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

// POST - Share a conversation
export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
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

    // Generate a unique share ID if not already shared
    let shareId = chatSession.shareId;
    if (!shareId) {
      shareId = nanoid(12); // Generate a 12-character unique ID
    }

    // Update the session to mark it as shared
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        isShared: true,
        shareId: shareId,
      },
    });

    return NextResponse.json({
      message: 'Conversation shared successfully',
      shareId: shareId,
      shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${shareId}`,
    }, { status: 200 });

  } catch (error) {
    console.error('Error sharing conversation:', error);
    return NextResponse.json({ message: 'Error sharing conversation' }, { status: 500 });
  }
}

// DELETE - Unshare a conversation
export async function DELETE(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
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

    // Update the session to mark it as not shared
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        isShared: false,
        shareId: null,
      },
    });

    return NextResponse.json({
      message: 'Conversation unshared successfully',
    }, { status: 200 });

  } catch (error) {
    console.error('Error unsharing conversation:', error);
    return NextResponse.json({ message: 'Error unsharing conversation' }, { status: 500 });
  }
}
