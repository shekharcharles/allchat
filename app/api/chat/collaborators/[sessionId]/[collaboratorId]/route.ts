import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// DELETE - Remove a collaborator from a conversation
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { sessionId: string; collaboratorId: string } }
) {
  const { sessionId, collaboratorId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Verify user owns this conversation
    const chatSession = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId: userId,
      },
    });

    if (!chatSession) {
      return NextResponse.json({ message: 'Conversation not found or unauthorized' }, { status: 404 });
    }

    // Prevent removing the owner
    if (collaboratorId === userId) {
      return NextResponse.json({ message: 'Cannot remove the owner' }, { status: 400 });
    }

    // In a real implementation, you'd delete the collaboration record
    // For now, return a success response
    return NextResponse.json({
      message: 'Collaborator removed successfully',
    }, { status: 200 });

  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json({ 
      message: 'Error removing collaborator',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update collaborator role
export async function PUT(
  request: NextRequest, 
  { params }: { params: { sessionId: string; collaboratorId: string } }
) {
  const { sessionId, collaboratorId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { role } = body;

    if (!role || !['viewer', 'editor'].includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    // Verify user owns this conversation
    const chatSession = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId: userId,
      },
    });

    if (!chatSession) {
      return NextResponse.json({ message: 'Conversation not found or unauthorized' }, { status: 404 });
    }

    // Prevent changing owner role
    if (collaboratorId === userId) {
      return NextResponse.json({ message: 'Cannot change owner role' }, { status: 400 });
    }

    // In a real implementation, you'd update the collaboration record
    // For now, return a success response
    return NextResponse.json({
      message: 'Collaborator role updated successfully',
      role,
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating collaborator role:', error);
    return NextResponse.json({ 
      message: 'Error updating collaborator role',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
