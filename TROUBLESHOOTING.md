# T3 Chat Troubleshooting Guide

## Database Connection Issues

If you're getting a 500 error when trying to access `/api/chat/sessions`, follow these steps:

### 1. Check MongoDB Status

First, make sure MongoDB is running on your system:

```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Or check if the port is open
netstat -an | grep 27017
```

### 2. Run Database Setup

We've created automated scripts to help diagnose and fix database issues:

```bash
# Test your database connection
npm run db:test

# Set up the database with the correct connection string
npm run db:setup

# Migrate existing data to include new fields
npm run db:migrate
```

### 3. Manual MongoDB Setup

If MongoDB isn't running, start it:

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

**macOS:**
```bash
# Using Homebrew
brew services start mongodb-community

# Or start manually
mongod --config /usr/local/etc/mongod.conf
```

**Linux:**
```bash
# Using systemd
sudo systemctl start mongod

# Or start manually
mongod --dbpath /var/lib/mongodb
```

### 4. Database Connection String Issues

The app tries to connect to MongoDB using the `DATABASE_URL` in your `.env` file. Common issues:

**Issue: Replica Set Configuration**
```
# If you see errors about replica sets, use this simpler connection:
DATABASE_URL=mongodb://localhost:27017/t3

# Instead of:
DATABASE_URL=mongodb://localhost:27017/t3?replicaSet=rs0
```

**Issue: Connection Refused**
```
# Try different connection strings:
DATABASE_URL=mongodb://127.0.0.1:27017/t3
DATABASE_URL=mongodb://localhost:27017/t3?directConnection=true
```

### 5. Schema Migration Issues

If you have existing chat sessions but they're missing new fields:

```bash
# Run the migration script
npm run db:migrate
```

This will add the following fields to existing chat sessions:
- `description`
- `tags`
- `isTemplate`
- `isShared`
- `shareId`
- `parentId`
- `branchPoint`
- `isArchived`
- `isFavorite`
- `category`

### 6. Common Error Messages

**"Error fetching chat sessions"**
- Usually indicates a database connection issue
- Run `npm run db:test` to diagnose
- Check if MongoDB is running
- Verify the `DATABASE_URL` in `.env`

**"MongoServerError: bad auth"**
- Authentication issue
- Make sure your MongoDB doesn't require authentication, or update the connection string with credentials

**"MongoNetworkError: connect ECONNREFUSED"**
- MongoDB is not running
- Start MongoDB service
- Check if the port (27017) is correct

**"PrismaClientInitializationError"**
- Prisma can't connect to the database
- Run `npx prisma generate` to regenerate the client
- Check the `DATABASE_URL` format

### 7. Fresh Installation

If you're setting up the project for the first time:

```bash
# 1. Install dependencies
npm install

# 2. Set up the database
npm run db:setup

# 3. Generate Prisma client
npx prisma generate

# 4. Start the development server
npm run dev
```

### 8. Reset Everything

If nothing else works, you can reset the entire setup:

```bash
# 1. Stop the development server
# 2. Clear the database (WARNING: This deletes all data)
mongosh t3 --eval "db.dropDatabase()"

# 3. Set up fresh database
npm run db:setup

# 4. Restart the development server
npm run dev
```

### 9. Environment Variables

Make sure your `.env` file contains:

```env
# Database
DATABASE_URL=mongodb://localhost:27017/t3

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OpenAI (optional)
OPENAI_API_KEY=your-openai-key-here
```

### 10. Getting Help

If you're still having issues:

1. Run `npm run db:test` and share the output
2. Check the browser console for additional error messages
3. Check the server logs in your terminal
4. Make sure you're using Node.js 18+ and MongoDB 5.0+

### 11. Development vs Production

**Development:**
- Uses local MongoDB instance
- Connection string: `mongodb://localhost:27017/t3`
- No authentication required

**Production:**
- Should use MongoDB Atlas or hosted MongoDB
- Connection string includes authentication
- Example: `mongodb+srv://user:pass@cluster.mongodb.net/t3`

## Quick Fix Commands

```bash
# One-liner to fix most database issues
npm run db:setup && npm run db:migrate && npm run dev

# Check if everything is working
npm run db:test
```

This should resolve most database connection issues. If you're still having problems, the issue might be with your MongoDB installation or system configuration.
