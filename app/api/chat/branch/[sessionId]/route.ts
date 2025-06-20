import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST - Create a branch from a conversation at a specific message
export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { messageId, title } = body;

    if (!messageId) {
      return NextResponse.json({ message: 'Message ID is required for branching' }, { status: 400 });
    }

    // Verify ownership of the original chat session
    const originalSession = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId: userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!originalSession) {
      return NextResponse.json({ message: 'Original chat session not found or unauthorized' }, { status: 404 });
    }

    // Verify the message exists and belongs to this session
    const branchMessage = originalSession.messages.find(msg => msg.id === messageId);
    if (!branchMessage) {
      return NextResponse.json({ message: 'Branch message not found in this session' }, { status: 404 });
    }

    // Get all messages up to and including the branch point
    const messagesToCopy = originalSession.messages.filter(msg => 
      new Date(msg.createdAt) <= new Date(branchMessage.createdAt)
    );

    // Create the new branched session
    const branchedSession = await prisma.chatSession.create({
      data: {
        title: title || `${originalSession.title} (Branch)`,
        description: `Branched from "${originalSession.title}" at message: ${branchMessage.content.substring(0, 50)}...`,
        userId: userId,
        provider: originalSession.provider,
        model: originalSession.model,
        parentId: sessionId,
        branchPoint: messageId,
        category: originalSession.category,
        tags: originalSession.tags,
        messageCount: messagesToCopy.length,
      },
    });

    // Copy messages up to the branch point
    const messagesToCreate = messagesToCopy.map(msg => ({
      content: msg.content,
      role: msg.role,
      userId: userId,
      sessionId: branchedSession.id,
      provider: msg.provider,
      model: msg.model,
      createdAt: msg.createdAt,
    }));

    await prisma.chatMessage.createMany({
      data: messagesToCreate,
    });

    return NextResponse.json({
      message: 'Conversation branched successfully',
      branchedSession: {
        id: branchedSession.id,
        title: branchedSession.title,
        parentId: branchedSession.parentId,
        branchPoint: branchedSession.branchPoint,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error branching conversation:', error);
    return NextResponse.json({ message: 'Error branching conversation' }, { status: 500 });
  }
}

// GET - Get all branches of a conversation
export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
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

    // Get all branches of this conversation
    const branches = await prisma.chatSession.findMany({
      where: {
        parentId: sessionId,
        userId: userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        messageCount: true,
        branchPoint: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Also get branches where this session is a branch (to show the parent)
    const parentInfo = chatSession.parentId ? await prisma.chatSession.findUnique({
      where: { id: chatSession.parentId },
      select: {
        id: true,
        title: true,
      },
    }) : null;

    return NextResponse.json({
      branches,
      parent: parentInfo,
      isRoot: !chatSession.parentId,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching conversation branches:', error);
    return NextResponse.json({ message: 'Error fetching branches' }, { status: 500 });
  }
}
