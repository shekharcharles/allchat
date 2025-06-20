import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// PUT - Update conversation metadata
export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const {
      title,
      description,
      tags,
      category,
      isArchived,
      isFavorite,
      isTemplate,
    } = body;

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

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (isArchived !== undefined) updateData.isArchived = isArchived;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (isTemplate !== undefined) updateData.isTemplate = isTemplate;

    // Update the session
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Conversation updated successfully',
      session: {
        id: updatedSession.id,
        title: updatedSession.title,
        description: updatedSession.description,
        tags: updatedSession.tags,
        category: updatedSession.category,
        isArchived: updatedSession.isArchived,
        isFavorite: updatedSession.isFavorite,
        isTemplate: updatedSession.isTemplate,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ message: 'Error updating conversation' }, { status: 500 });
  }
}
