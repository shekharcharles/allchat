import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Get collaborators for a conversation
export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Verify user has access to this conversation
    const chatSession = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId: userId,
      },
    });

    if (!chatSession) {
      return NextResponse.json({ message: 'Conversation not found or unauthorized' }, { status: 404 });
    }

    // For now, return mock collaborators since we haven't implemented the full collaboration schema
    // In a real implementation, you'd have a separate Collaborator model
    const mockCollaborators = [
      {
        id: '1',
        email: session.user.email,
        name: session.user.name || 'You',
        avatar: session.user.image,
        role: 'owner',
        joinedAt: chatSession.createdAt.toISOString(),
        lastActive: new Date().toISOString(),
      }
    ];

    return NextResponse.json({
      collaborators: mockCollaborators,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json({ 
      message: 'Error fetching collaborators',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Add a collaborator to a conversation
export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ message: 'Email and role are required' }, { status: 400 });
    }

    if (!['viewer', 'editor'].includes(role)) {
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

    // Check if user exists
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // In a real implementation, you'd create a collaboration record
    // For now, return a mock response
    const mockCollaborator = {
      id: invitedUser.id,
      email: invitedUser.email,
      name: invitedUser.name || 'Unknown User',
      avatar: invitedUser.image,
      role,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    return NextResponse.json({
      message: 'Collaborator added successfully',
      collaborator: mockCollaborator,
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding collaborator:', error);
    return NextResponse.json({ 
      message: 'Error adding collaborator',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
