import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MongoClient, GridFSBucket } from 'mongodb'; // MongoClient remains for GridFS setup
import { Readable } from 'stream';
import prisma from '@/lib/prisma'; // Import Prisma Client

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',

  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Text files
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/css',
  'text/javascript',
  'text/xml',
  'application/json',
  'application/xml',

  // Code files
  'application/javascript',
  'application/typescript',
  'text/x-python',
  'text/x-java',
  'text/x-c',
  'text/x-cpp',
  'text/x-csharp',
  'text/x-php',
  'text/x-ruby',
  'text/x-go',
  'text/x-rust',
  'text/x-swift',
  'text/x-kotlin',

  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',

  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/webm',

  // Video
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv'
];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        message: `File type ${file.type} is not allowed` 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Connect to MongoDB using direct MongoClient for GridFS
    const mongoUrl = process.env.DATABASE_URL?.replace('?directConnection=true', '') || 'mongodb://localhost:27017/t3';
    const client = new MongoClient(mongoUrl); // Declare client with const here
    await client.connect();
    
    const db = client.db('t3');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create readable stream from buffer
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${timestamp}-${randomString}.${fileExtension}`;

    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      metadata: {
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        userId: userId, // Store as string in GridFS metadata
        uploadedAt: new Date(),
      }
    });

    // Pipe the file to GridFS
    await new Promise<void>((resolve, reject) => { // Explicitly type Promise to void
      readableStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    // Store file metadata in Prisma
    const createdFileMetadata = await prisma.fileMetadata.create({
      data: {
        gridFSId: uploadStream.id.toString(), // Convert ObjectId to string for Prisma
        originalName: file.name,
        filename: uniqueFilename,
        mimeType: file.type,
        size: file.size,
        userId: userId, // userId is already string
        uploadedAt: new Date(),
        isDeleted: false,
      },
    });

    // Close the direct MongoDB client after GridFS operation
    await client.close();

    // Return file information
    const responseData = {
      id: createdFileMetadata.id,
      gridFSId: createdFileMetadata.gridFSId,
      filename: createdFileMetadata.filename,
      originalName: createdFileMetadata.originalName,
      mimeType: createdFileMetadata.mimeType,
      size: createdFileMetadata.size,
      uploadedAt: createdFileMetadata.uploadedAt,
      url: `/api/files/${createdFileMetadata.id}`,
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({
      message: 'Error uploading file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get user's uploaded files
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const type = searchParams.get('type'); // Filter by file type

    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: userId,
      isDeleted: false,
    };

    if (type) {
      whereClause.mimeType = { startsWith: type };
    }

    const files = await prisma.fileMetadata.findMany({
      where: whereClause,
      orderBy: {
        uploadedAt: 'desc',
      },
      skip: skip,
      take: limit,
    });

    const totalFiles = await prisma.fileMetadata.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalFiles / limit);

    const formattedFiles = files.map((file: any) => ({
      id: file.id,
      gridFSId: file.gridFSId,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      uploadedAt: file.uploadedAt,
      url: `/api/files/${file.id}`,
    }));

    return NextResponse.json({
      files: formattedFiles,
      pagination: {
        currentPage: page,
        totalPages,
        totalFiles,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });

  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({
      message: 'Error fetching files',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
