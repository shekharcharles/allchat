import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 TEST API CALLED - This is definitely running on localhost:3000');
  console.log('📍 Request URL:', request.url);
  
  return NextResponse.json({
    message: 'Test API is working on localhost:3000',
    timestamp: new Date().toISOString(),
    url: request.url,
    host: request.headers.get('host')
  });
}
