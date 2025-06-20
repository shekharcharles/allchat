import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Get usage analytics
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || '7d';

  try {
    // Calculate date range
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's conversations and messages
    const conversations = await prisma.chatSession.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        messages: {
          where: {
            createdAt: {
              gte: startDate,
            },
          },
          select: {
            id: true,
            createdAt: true,
            model: true,
            provider: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalConversations = conversations.length;
    const allMessages = conversations.flatMap(conv => conv.messages);
    const totalMessages = allMessages.length;

    // Calculate model usage
    const modelUsage = allMessages.reduce((acc, message) => {
      const model = message.model || 'Unknown';
      acc[model] = (acc[model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularModels = Object.entries(modelUsage)
      .map(([name, usage]) => ({
        name,
        usage,
        percentage: totalMessages > 0 ? (usage / totalMessages) * 100 : 0,
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    // Generate daily activity (simplified)
    const dailyActivity = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayConversations = conversations.filter(conv => 
        conv.createdAt.toISOString().split('T')[0] === dateStr
      ).length;
      
      const dayMessages = allMessages.filter(msg => 
        msg.createdAt.toISOString().split('T')[0] === dateStr
      ).length;

      dailyActivity.push({
        date: dateStr,
        conversations: dayConversations,
        messages: dayMessages,
      });
    }

    // Calculate average session duration (mock for now)
    const avgSessionDuration = 18.5; // In minutes

    // Get active users count (for admin users, this would be system-wide)
    const activeUsers = 1; // Current user only for individual analytics

    const usageStats = {
      totalConversations,
      totalMessages,
      activeUsers,
      avgSessionDuration,
      popularModels,
      dailyActivity,
    };

    return NextResponse.json(usageStats, { status: 200 });

  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    return NextResponse.json({ 
      message: 'Error fetching usage analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
