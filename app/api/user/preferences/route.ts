import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET user preferences
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          defaultModel: 'openai/gpt-4o-mini',
          theme: 'light',
          language: 'en',
          enableAnimations: true,
          enableSounds: false,
          compactMode: false,
          fontSize: 'medium',
          chatBubbleStyle: 'modern',
          enableStreaming: true,
          maxTokens: 2048,
          temperature: 0.7,
          enableAutoSave: true,
          desktopNotifications: false,
          emailUpdates: true,
          shareAnalytics: true,
          saveConversations: true,
        },
      });
    }

    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ message: 'Error fetching preferences' }, { status: 500 });
  }
}

// POST/PUT update user preferences
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const {
      defaultModel,
      theme,
      language,
      enableAnimations,
      enableSounds,
      compactMode,
      fontSize,
      chatBubbleStyle,
      enableStreaming,
      maxTokens,
      temperature,
      enableAutoSave,
      desktopNotifications,
      emailUpdates,
      shareAnalytics,
      saveConversations
    } = body;

    // Validate the data
    if (defaultModel && typeof defaultModel !== 'string') {
      return NextResponse.json({ message: 'Invalid defaultModel' }, { status: 400 });
    }

    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json({ message: 'Invalid theme' }, { status: 400 });
    }

    if (fontSize && !['small', 'medium', 'large'].includes(fontSize)) {
      return NextResponse.json({ message: 'Invalid fontSize' }, { status: 400 });
    }

    if (chatBubbleStyle && !['modern', 'classic', 'minimal'].includes(chatBubbleStyle)) {
      return NextResponse.json({ message: 'Invalid chatBubbleStyle' }, { status: 400 });
    }

    if (maxTokens && (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 32000)) {
      return NextResponse.json({ message: 'Invalid maxTokens' }, { status: 400 });
    }

    if (temperature && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
      return NextResponse.json({ message: 'Invalid temperature' }, { status: 400 });
    }

    // Update or create preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        ...(defaultModel !== undefined && { defaultModel }),
        ...(theme !== undefined && { theme }),
        ...(language !== undefined && { language }),
        ...(enableAnimations !== undefined && { enableAnimations }),
        ...(enableSounds !== undefined && { enableSounds }),
        ...(compactMode !== undefined && { compactMode }),
        ...(fontSize !== undefined && { fontSize }),
        ...(chatBubbleStyle !== undefined && { chatBubbleStyle }),
        ...(enableStreaming !== undefined && { enableStreaming }),
        ...(maxTokens !== undefined && { maxTokens }),
        ...(temperature !== undefined && { temperature }),
        ...(enableAutoSave !== undefined && { enableAutoSave }),
        ...(desktopNotifications !== undefined && { desktopNotifications }),
        ...(emailUpdates !== undefined && { emailUpdates }),
        ...(shareAnalytics !== undefined && { shareAnalytics }),
        ...(saveConversations !== undefined && { saveConversations }),
      },
      create: {
        userId,
        defaultModel: defaultModel || 'openai/gpt-4o-mini',
        theme: theme || 'light',
        language: language || 'en',
        enableAnimations: enableAnimations ?? true,
        enableSounds: enableSounds ?? false,
        compactMode: compactMode ?? false,
        fontSize: fontSize || 'medium',
        chatBubbleStyle: chatBubbleStyle || 'modern',
        enableStreaming: enableStreaming ?? true,
        maxTokens: maxTokens || 2048,
        temperature: temperature || 0.7,
        enableAutoSave: enableAutoSave ?? true,
        desktopNotifications: desktopNotifications ?? false,
        emailUpdates: emailUpdates ?? true,
        shareAnalytics: shareAnalytics ?? true,
        saveConversations: saveConversations ?? true,
      },
    });

    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ message: 'Error updating preferences' }, { status: 500 });
  }
}
