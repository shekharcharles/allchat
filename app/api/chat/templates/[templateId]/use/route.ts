import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST - Create a new conversation from a template
export async function POST(request: NextRequest, { params }: { params: { templateId: string } }) {
  const { templateId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { title } = body;

    // Get the template
    const template = await prisma.chatSession.findUnique({
      where: {
        id: templateId,
        userId: userId,
        isTemplate: true,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!template) {
      return NextResponse.json({ message: 'Template not found or unauthorized' }, { status: 404 });
    }

    // Create new conversation from template
    const newSession = await prisma.chatSession.create({
      data: {
        title: title || `${template.title} (from template)`,
        description: `Created from template: ${template.title}`,
        userId: userId,
        provider: template.provider,
        model: template.model,
        category: template.category,
        tags: template.tags,
        isTemplate: false,
        messageCount: template.messageCount,
      },
    });

    // Copy messages from template
    if (template.messages.length > 0) {
      const messagesToCreate = template.messages.map(msg => ({
        content: msg.content,
        role: msg.role,
        userId: userId,
        sessionId: newSession.id,
        provider: msg.provider,
        model: msg.model,
      }));

      await prisma.chatMessage.createMany({
        data: messagesToCreate,
      });
    }

    return NextResponse.json({
      message: 'Conversation created from template successfully',
      session: {
        id: newSession.id,
        title: newSession.title,
        description: newSession.description,
        messageCount: newSession.messageCount,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation from template:', error);
    return NextResponse.json({ message: 'Error creating conversation from template' }, { status: 500 });
  }
}
