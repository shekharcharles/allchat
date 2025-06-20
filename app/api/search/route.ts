import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface SearchResult {
  id: string;
  type: 'conversation' | 'message' | 'file' | 'template';
  title: string;
  content: string;
  snippet?: string;
  metadata: {
    date: string;
    author?: string;
    tags?: string[];
    category?: string;
    model?: string;
    fileType?: string;
    size?: number;
  };
  relevanceScore: number;
}

// POST - Perform search across all content types
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { query, category, limit = 20 } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ message: 'Query is required' }, { status: 400 });
    }

    const searchQuery = query.trim().toLowerCase();
    const results: SearchResult[] = [];

    // Search conversations
    if (!category || category === 'conversations') {
      const conversations = await prisma.chatSession.findMany({
        where: {
          userId: userId,
          isDeleted: false,
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { tags: { hasSome: [searchQuery] } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          tags: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          messageCount: true,
          isTemplate: true,
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });

      conversations.forEach(conv => {
        const relevanceScore = calculateRelevanceScore(searchQuery, conv.title, conv.description);
        results.push({
          id: conv.id,
          type: conv.isTemplate ? 'template' : 'conversation',
          title: conv.title,
          content: conv.description || '',
          snippet: conv.description ? conv.description.substring(0, 150) + '...' : undefined,
          metadata: {
            date: (conv.updatedAt || conv.createdAt).toISOString(),
            tags: conv.tags,
            category: conv.category || 'general',
          },
          relevanceScore,
        });
      });
    }

    // Search messages
    if (!category || category === 'messages') {
      const messages = await prisma.chatMessage.findMany({
        where: {
          userId: userId,
          content: { contains: searchQuery, mode: 'insensitive' },
          session: {
            isDeleted: false,
          },
        },
        include: {
          session: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      messages.forEach(msg => {
        const relevanceScore = calculateRelevanceScore(searchQuery, msg.content);
        const snippet = extractSnippet(msg.content, searchQuery);
        
        results.push({
          id: msg.id,
          type: 'message',
          title: `Message in "${msg.session?.title || 'Untitled'}"`,
          content: msg.content,
          snippet,
          metadata: {
            date: msg.createdAt.toISOString(),
            author: msg.role === 'user' ? 'You' : 'AI',
            category: msg.session?.category || 'general',
            model: msg.model || undefined,
          },
          relevanceScore,
        });
      });
    }

    // Search files
    if (!category || category === 'files') {
      const files = await prisma.fileMetadata.findMany({
        where: {
          userId: userId,
          isDeleted: false,
          originalName: { contains: searchQuery, mode: 'insensitive' },
        },
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      });

      files.forEach(file => {
        const relevanceScore = calculateRelevanceScore(searchQuery, file.originalName);
        results.push({
          id: file.id,
          type: 'file',
          title: file.originalName,
          content: file.filename,
          metadata: {
            date: file.uploadedAt.toISOString(),
            fileType: file.mimeType,
            size: file.size,
          },
          relevanceScore,
        });
      });
    }

    // Sort results by relevance score and date
    results.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
    });

    // Limit total results
    const limitedResults = results.slice(0, limit);

    return NextResponse.json({
      results: limitedResults,
      total: results.length,
      query: searchQuery,
      category: category || 'all',
    }, { status: 200 });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      message: 'Error performing search',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Calculate relevance score based on query match
function calculateRelevanceScore(query: string, ...texts: (string | null | undefined)[]): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  
  texts.forEach((text, index) => {
    if (!text) return;
    
    const textLower = text.toLowerCase();
    
    // Exact match gets highest score
    if (textLower === queryLower) {
      score += 100;
    }
    // Title/first text gets higher weight
    else if (textLower.includes(queryLower)) {
      const weight = index === 0 ? 10 : 5; // First text (usually title) gets more weight
      score += weight;
    }
    // Word boundary matches get medium score
    else if (new RegExp(`\\b${queryLower}\\b`).test(textLower)) {
      score += 3;
    }
    // Partial matches get lower score
    else if (textLower.includes(queryLower.substring(0, Math.max(3, queryLower.length - 2)))) {
      score += 1;
    }
  });
  
  return score;
}

// Extract snippet around the search query
function extractSnippet(text: string, query: string, maxLength: number = 150): string {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const queryIndex = textLower.indexOf(queryLower);
  
  if (queryIndex === -1) {
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }
  
  const start = Math.max(0, queryIndex - 50);
  const end = Math.min(text.length, queryIndex + query.length + 50);
  
  let snippet = text.substring(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}

// GET - Get search suggestions and trending searches
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'suggestions') {
      // Get recent conversation titles and tags for suggestions
      const recentConversations = await prisma.chatSession.findMany({
        where: {
          userId: userId,
          isDeleted: false,
        },
        select: {
          title: true,
          tags: true,
        },
        take: 20,
        orderBy: { updatedAt: 'desc' },
      });

      const suggestions = new Set<string>();
      
      recentConversations.forEach(conv => {
        // Add conversation titles
        if (conv.title && conv.title !== 'New Chat') {
          suggestions.add(conv.title);
        }
        
        // Add tags
        conv.tags.forEach(tag => suggestions.add(tag));
      });

      return NextResponse.json({
        suggestions: Array.from(suggestions).slice(0, 10),
      }, { status: 200 });
    }

    if (type === 'trending') {
      // For now, return static trending searches
      // In a real app, you might track search frequency
      const trending = [
        'How to code in Python',
        'AI model comparison',
        'Data analysis techniques',
        'Creative writing prompts',
        'Machine learning basics',
        'Web development tips',
        'Database design patterns',
        'API best practices',
        'UI/UX principles',
        'Project management'
      ];

      return NextResponse.json({
        trending,
      }, { status: 200 });
    }

    return NextResponse.json({ message: 'Invalid type parameter' }, { status: 400 });

  } catch (error) {
    console.error('Error getting search data:', error);
    return NextResponse.json({ 
      message: 'Error getting search data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
