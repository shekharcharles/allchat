import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllProviders } from '@/lib/llm-providers';
import { getAvailableProviders, validateEnvironment } from '@/lib/env-config';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get all providers and filter by availability
    const allProviders = getAllProviders();
    const availableProviderIds = getAvailableProviders();
    
    // Filter providers to only include available ones
    const availableProviders = allProviders.filter(provider => 
      availableProviderIds.includes(provider.id)
    );

    // Validate environment and get any warnings
    const envValidation = validateEnvironment();

    return NextResponse.json({
      providers: availableProviders,
      availableProviderIds,
      validation: envValidation,
      totalProviders: allProviders.length,
      availableCount: availableProviders.length,
    });

  } catch (error) {
    console.error('Error fetching LLM providers:', error);
    return NextResponse.json(
      { 
        message: 'Error fetching providers',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
