import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get shared conversation by share ID
export async function GET(request: NextRequest, { params }: { params: { shareId: string } }) {
  const { shareId } = params;

  try {
    // Find the conversation by share ID
    const conversation = await prisma.chatSession.findFirst({
      where: {
        shareId: shareId,
        isShared: true,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            role: true,
            createdAt: true,
            model: true,
          },
        },
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ message: 'Shared conversation not found' }, { status: 404 });
    }

    // Check if conversation has expired (if expiration was implemented)
    // if (conversation.expiresAt && new Date() > conversation.expiresAt) {
    //   return NextResponse.json({ message: 'Shared conversation has expired' }, { status: 410 });
    // }

    // Check if authentication is required (if implemented)
    // if (conversation.requireAuth) {
    //   const session = await getServerSession(authOptions);
    //   if (!session) {
    //     return NextResponse.json({ message: 'Authentication required' }, { status: 403 });
    //   }
    // }

    // Increment view count (in a real app, you might want to track unique views)
    // For now, we'll return a mock view count
    const viewCount = Math.floor(Math.random() * 100) + 1;

    // Format the response
    const sharedConversation = {
      id: conversation.id,
      title: conversation.title,
      description: conversation.description,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt?.toISOString(),
      messageCount: conversation.messageCount,
      category: conversation.category || 'general',
      tags: conversation.tags,
      author: {
        name: conversation.user.name || 'Anonymous',
        avatar: conversation.user.image,
      },
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role.toLowerCase(),
        createdAt: msg.createdAt.toISOString(),
        model: msg.model,
      })),
      settings: {
        allowComments: true, // Default settings since not implemented in schema
        allowDownload: true,
        requireAuth: false,
      },
    };

    return NextResponse.json({
      conversation: sharedConversation,
      viewCount,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching shared conversation:', error);
    return NextResponse.json({ 
      message: 'Error fetching shared conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
