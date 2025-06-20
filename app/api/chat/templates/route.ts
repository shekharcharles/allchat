import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Get all conversation templates
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const templates = await prisma.chatSession.findMany({
      where: {
        userId: userId,
        isTemplate: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        messageCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(templates, { status: 200 });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ message: 'Error fetching templates' }, { status: 500 });
  }
}

// POST - Create a new template from a conversation or create a blank template
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { sessionId, title, description, category, tags } = body;

    if (sessionId) {
      // Create template from existing conversation
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
        return NextResponse.json({ message: 'Original conversation not found or unauthorized' }, { status: 404 });
      }

      // Create the template session
      const templateSession = await prisma.chatSession.create({
        data: {
          title: title || `${originalSession.title} (Template)`,
          description: description || originalSession.description,
          userId: userId,
          provider: originalSession.provider,
          model: originalSession.model,
          category: category || originalSession.category || 'general',
          tags: tags || originalSession.tags,
          isTemplate: true,
          messageCount: originalSession.messageCount,
        },
      });

      // Copy messages from original conversation
      const messagesToCreate = originalSession.messages.map(msg => ({
        content: msg.content,
        role: msg.role,
        userId: userId,
        sessionId: templateSession.id,
        provider: msg.provider,
        model: msg.model,
        createdAt: msg.createdAt,
      }));

      await prisma.chatMessage.createMany({
        data: messagesToCreate,
      });

      return NextResponse.json({
        message: 'Template created successfully',
        template: {
          id: templateSession.id,
          title: templateSession.title,
          description: templateSession.description,
        },
      }, { status: 201 });

    } else {
      // Create blank template
      if (!title) {
        return NextResponse.json({ message: 'Title is required for blank template' }, { status: 400 });
      }

      const templateSession = await prisma.chatSession.create({
        data: {
          title,
          description: description || '',
          userId: userId,
          category: category || 'general',
          tags: tags || [],
          isTemplate: true,
          messageCount: 0,
        },
      });

      return NextResponse.json({
        message: 'Blank template created successfully',
        template: {
          id: templateSession.id,
          title: templateSession.title,
          description: templateSession.description,
        },
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ message: 'Error creating template' }, { status: 500 });
  }
}
