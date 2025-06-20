import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Health check endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbStart = Date.now();
    let dbTime = 0;
    let dbStatus = 'disconnected';

    try {
      if (prisma && prisma.$queryRaw) {
        await prisma.$queryRaw`SELECT 1`;
        dbTime = Date.now() - dbStart;
        dbStatus = 'connected';
      } else {
        dbStatus = 'client_not_initialized';
      }
    } catch (dbError) {
      dbTime = Date.now() - dbStart;
      dbStatus = 'error';
    }

    // Check environment variables
    const envChecks = {
      database: !!process.env.DATABASE_URL,
      nextauth: !!process.env.NEXTAUTH_SECRET,
      openai: !!process.env.OPENAI_API_KEY,
    };

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          responseTime: `${dbTime}ms`,
        },
        environment: {
          status: Object.values(envChecks).every(Boolean) ? 'configured' : 'partial',
          details: envChecks,
        },
      },
      performance: {
        responseTime: `${totalTime}ms`,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
      },
      version: process.env.npm_package_version || '0.1.0',
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        responseTime: `${totalTime}ms`,
      },
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
