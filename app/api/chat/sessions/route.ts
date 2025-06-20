import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma'; // Import Prisma client

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const includeTemplates = searchParams.get('includeTemplates') === 'true';
    const category = searchParams.get('category');

    // Start with basic query for compatibility
    const whereClause: any = {
      userId: userId,
    };

    // Try to query with new fields first, fall back to basic query if it fails
    let chatSessions;
    try {
      // Try querying with all new fields
      const advancedWhereClause = { ...whereClause };

      // Add filters for new fields if they're supported
      if (!includeArchived) {
        advancedWhereClause.isArchived = false;
      }
      if (!includeTemplates) {
        advancedWhereClause.isTemplate = false;
      }
      if (category && category !== 'all') {
        advancedWhereClause.category = category;
      }

      chatSessions = await prisma.chatSession.findMany({
        where: advancedWhereClause,
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          provider: true,
          model: true,
          messageCount: true,
          tags: true,
          isTemplate: true,
          isShared: true,
          shareId: true,
          parentId: true,
          branchPoint: true,
          isArchived: true,
          isFavorite: true,
          category: true,
        },
      });
    } catch (advancedError) {
      console.log('Advanced query failed, falling back to basic query:', advancedError instanceof Error ? advancedError.message : 'Unknown error');

      // Fall back to basic query without new fields
      chatSessions = await prisma.chatSession.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          provider: true,
          model: true,
          messageCount: true,
        },
      });

      // Transform the data to include default values for new fields
      chatSessions = chatSessions.map(session => ({
        ...session,
        description: null,
        tags: [],
        isTemplate: false,
        isShared: false,
        shareId: null,
        parentId: null,
        branchPoint: null,
        isArchived: false,
        isFavorite: false,
        category: 'general',
      }));
    }

    return NextResponse.json(chatSessions, { status: 200 });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);

    // Provide more detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      message: 'Error fetching chat sessions',
      error: errorMessage,
      userId: userId,
      timestamp: new Date().toISOString(),
    };

    console.error('Detailed error:', errorDetails);

    return NextResponse.json({
      message: 'Error fetching chat sessions',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
    }, { status: 500 });
  }
}
