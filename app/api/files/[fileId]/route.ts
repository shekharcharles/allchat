import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import prisma from '@/lib/prisma';

// GET - Download or view file
export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const { fileId } = params;

  try {
    // Get file metadata from Prisma
    const fileMetadata = await prisma.fileMetadata.findUnique({
      where: {
        id: fileId,
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
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileMetadata.gridFSId));

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    
    return new Promise<NextResponse>((resolve, reject) => {
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on('end', async () => {
        await client.close();
        
        const buffer = Buffer.concat(chunks);
        
        // Set appropriate headers
        const headers = new Headers();
        headers.set('Content-Type', fileMetadata.mimeType);
        headers.set('Content-Length', buffer.length.toString());
        headers.set('Content-Disposition', `inline; filename="${fileMetadata.originalName}"`);
        
        // Add cache headers for better performance
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('ETag', `"${fileMetadata.gridFSId}"`);
        
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
    console.error('Error retrieving file:', error);
    return NextResponse.json({ 
      message: 'Error retrieving file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete file
export async function DELETE(request: NextRequest, { params }: { params: { fileId: string } }) {
  const { fileId } = params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Get file metadata
    const fileMetadata = await prisma.fileMetadata.findUnique({
      where: {
        id: fileId,
        userId: userId,
        isDeleted: false,
      },
    });

    if (!fileMetadata) {
      return NextResponse.json({ message: 'File not found or unauthorized' }, { status: 404 });
    }

    // Mark file as deleted in Prisma (soft delete)
    await prisma.fileMetadata.update({
      where: { id: fileId },
      data: { isDeleted: true },
    });

    // Optionally, delete from GridFS as well (hard delete)
    // Uncomment the following code if you want to permanently delete files
    /*
    const mongoUrl = process.env.DATABASE_URL?.replace('?directConnection=true', '') || 'mongodb://localhost:27017/t3';
    const client = new MongoClient(mongoUrl);
    await client.connect();
    
    const db = client.db('t3');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    
    try {
      await bucket.delete(new ObjectId(fileMetadata.gridFSId));
    } catch (gridfsError) {
      console.warn('File not found in GridFS, but metadata deleted:', gridfsError);
    }
    
    await client.close();
    */

    return NextResponse.json({ message: 'File deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ 
      message: 'Error deleting file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
