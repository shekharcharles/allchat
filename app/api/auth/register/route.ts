import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs'; // Import bcryptjs

export async function POST(request: Request) {
  let client: MongoClient | null = null;

  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Connect to MongoDB directly
    const mongoUrl = process.env.DATABASE_URL?.replace('?directConnection=true', '') || 'mongodb://localhost:27017/t3';
    client = new MongoClient(mongoUrl);
    await client.connect();

    const db = client.db('t3');
    const usersCollection = db.collection('User');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 }); // 409 Conflict
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Create new user in the database
    const userDoc = {
      email,
      password: hashedPassword,
      name: name || null,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(userDoc);

    // Don't return the password in the response
    const userWithoutPassword = {
      id: result.insertedId.toString(),
      email: userDoc.email,
      name: userDoc.name,
      createdAt: userDoc.createdAt,
    };

    return NextResponse.json({ message: 'User registered successfully', user: userWithoutPassword }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred during registration' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
