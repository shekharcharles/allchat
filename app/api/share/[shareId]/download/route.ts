import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Download shared conversation as JSON
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
            email: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ message: 'Shared conversation not found' }, { status: 404 });
    }

    // Check if download is allowed (in a real app, this would be stored in share settings)
    // For now, we'll assume downloads are allowed
    const allowDownload = true;

    if (!allowDownload) {
      return NextResponse.json({ message: 'Downloads are not allowed for this conversation' }, { status: 403 });
    }

    // Format the conversation for download
    const downloadData = {
      conversation: {
        id: conversation.id,
        title: conversation.title,
        description: conversation.description,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt?.toISOString(),
        category: conversation.category || 'general',
        tags: conversation.tags,
        messageCount: conversation.messageCount,
        author: {
          name: conversation.user.name || 'Anonymous',
          email: conversation.user.email, // Only include in downloads
        },
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role.toLowerCase(),
          timestamp: msg.createdAt.toISOString(),
          model: msg.model,
        })),
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedFrom: 'T3 Chat',
        version: '1.0',
        format: 'json',
      },
    };

    // Create the response with appropriate headers for download
    const jsonString = JSON.stringify(downloadData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json"`);
    headers.set('Content-Length', buffer.length.toString());

    return new NextResponse(buffer, { headers });

  } catch (error) {
    console.error('Error downloading shared conversation:', error);
    return NextResponse.json({ 
      message: 'Error downloading conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
