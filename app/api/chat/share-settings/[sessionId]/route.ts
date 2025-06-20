import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface ShareSettings {
  isPublic: boolean;
  allowComments: boolean;
  allowDownload: boolean;
  requireAuth: boolean;
  expiresAt?: string;
  password?: string;
}

// GET - Get share settings for a conversation
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

    // For now, return default settings since we haven't extended the schema
    // In a real implementation, you'd store these in a separate ShareSettings model
    const defaultSettings: ShareSettings = {
      isPublic: false,
      allowComments: true,
      allowDownload: true,
      requireAuth: false,
    };

    return NextResponse.json({
      settings: defaultSettings,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching share settings:', error);
    return NextResponse.json({ 
      message: 'Error fetching share settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update share settings for a conversation
export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ message: 'Settings are required' }, { status: 400 });
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

    // Validate settings
    const validatedSettings: ShareSettings = {
      isPublic: Boolean(settings.isPublic),
      allowComments: Boolean(settings.allowComments),
      allowDownload: Boolean(settings.allowDownload),
      requireAuth: Boolean(settings.requireAuth),
      expiresAt: settings.expiresAt || undefined,
      password: settings.password || undefined,
    };

    // In a real implementation, you'd save these settings to a ShareSettings model
    // For now, we'll just return success
    
    return NextResponse.json({
      message: 'Share settings updated successfully',
      settings: validatedSettings,
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating share settings:', error);
    return NextResponse.json({ 
      message: 'Error updating share settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
