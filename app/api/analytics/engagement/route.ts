import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Get user engagement metrics
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

    // Get user's activity data
    const conversations = await prisma.chatSession.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        messages: {
          select: {
            id: true,
            createdAt: true,
            role: true,
          },
        },
      },
    });

    // Calculate engagement metrics
    const totalSessions = conversations.length;
    const allMessages = conversations.flatMap(conv => conv.messages);
    const totalMessages = allMessages.length;
    
    // Average messages per session
    const avgMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;

    // For individual user analytics, we'll use mock data for some metrics
    // In a real app with multiple users, you'd calculate these from actual data
    const newUsers = 1; // Current user (simplified)
    const returningUsers = totalSessions > 1 ? 1 : 0;
    
    // Calculate bounce rate (sessions with only 1 message)
    const bounceSessions = conversations.filter(conv => conv.messages.length <= 1).length;
    const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

    // Calculate retention rate (simplified - users who had sessions in multiple days)
    const uniqueDays = new Set(
      conversations.map(conv => conv.createdAt.toISOString().split('T')[0])
    ).size;
    const retentionRate = days > 1 ? Math.min((uniqueDays / days) * 100, 100) : 100;

    // Mock feature usage data (in a real app, you'd track this)
    const topFeatures = [
      { feature: 'Chat Interface', usage: 95 },
      { feature: 'File Upload', usage: conversations.some(c => c.messages.length > 0) ? 67 : 0 },
      { feature: 'Code Generation', usage: Math.random() > 0.5 ? 54 : 0 },
      { feature: 'Search', usage: Math.random() > 0.3 ? 43 : 0 },
      { feature: 'Sharing', usage: conversations.some(c => c.isShared) ? 32 : 0 },
    ];

    const engagementMetrics = {
      newUsers,
      returningUsers,
      avgMessagesPerSession: Math.round(avgMessagesPerSession * 10) / 10,
      bounceRate: Math.round(bounceRate * 10) / 10,
      retentionRate: Math.round(retentionRate * 10) / 10,
      topFeatures,
    };

    return NextResponse.json(engagementMetrics, { status: 200 });

  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    return NextResponse.json({ 
      message: 'Error fetching engagement metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Track user engagement events
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { 
      event, 
      feature, 
      metadata, 
      timestamp 
    } = body;

    if (!event) {
      return NextResponse.json({ message: 'Event is required' }, { status: 400 });
    }

    // In a real application, you would store engagement events in a dedicated table
    // or send them to an analytics service like Google Analytics, Mixpanel, etc.

    const engagementEvent = {
      userId,
      event,
      feature: feature || null,
      metadata: metadata || {},
      timestamp: timestamp || new Date().toISOString(),
    };

    // For now, we'll just log the event
    console.log('Engagement event tracked:', engagementEvent);

    // In a real implementation, you might:
    // 1. Store in a UserEngagementEvent table
    // 2. Send to analytics service
    // 3. Update user engagement scores
    // 4. Trigger personalization algorithms

    return NextResponse.json({ 
      message: 'Engagement event tracked successfully',
      eventId: Date.now().toString(), // Mock event ID
    }, { status: 201 });

  } catch (error) {
    console.error('Error tracking engagement event:', error);
    return NextResponse.json({ 
      message: 'Error tracking engagement event',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
