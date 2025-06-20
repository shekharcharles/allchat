import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import prisma from '@/lib/prisma';

// GET - Download file by GridFS ID (used in chat messages)
export async function GET(request: NextRequest, { params }: { params: { gridFSId: string } }) {
  const { gridFSId } = params;

  try {
    // Get file metadata from Prisma using GridFS ID
    const fileMetadata = await prisma.fileMetadata.findFirst({
      where: {
        gridFSId: gridFSId,
        isDeleted: false,
      },
    });

    if (!fileMetadata) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    // Check if user has access to this file
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).id !== fileMetadata.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to MongoDB for GridFS
    const mongoUrl = process.env.DATABASE_URL?.replace('?directConnection=true', '') || 'mongodb://localhost:27017/t3';
    const client = new MongoClient(mongoUrl);
    await client.connect();
    
    const db = client.db('t3');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    // Get file from GridFS
    const downloadStream = bucket.openDownloadStream(new ObjectId(gridFSId));

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    
    return new Promise<NextResponse>((resolve, reject) => {
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on('end', async () => {
        await client.close();
        
        const buffer = Buffer.concat(chunks);
        
        // Set appropriate headers for download
        const headers = new Headers();
        headers.set('Content-Type', fileMetadata.mimeType);
        headers.set('Content-Length', buffer.length.toString());
        headers.set('Content-Disposition', `attachment; filename="${fileMetadata.originalName}"`);
        
        resolve(new NextResponse(buffer, { headers }));
      });

      downloadStream.on('error', async (error) => {
        await client.close();
        console.error('Error downloading file:', error);
        reject(new NextResponse(JSON.stringify({ message: 'Error downloading file' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }));
      });
    });

  } catch (error) {
    console.error('Error retrieving file for download:', error);
    return NextResponse.json({ 
      message: 'Error retrieving file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
