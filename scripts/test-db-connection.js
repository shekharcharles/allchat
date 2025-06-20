// Test database connection and schema
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if we can query users
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Test if we can query chat sessions
    const sessionCount = await prisma.chatSession.count();
    console.log(`✅ Found ${sessionCount} chat sessions in database`);
    
    // Test if new fields exist by trying to query them
    try {
      const sessionWithNewFields = await prisma.chatSession.findFirst({
        select: {
          id: true,
          title: true,
          description: true,
          tags: true,
          isTemplate: true,
          isShared: true,
          isArchived: true,
          isFavorite: true,
          category: true,
        },
      });
      console.log('✅ New fields are available in the database');
      console.log('Sample session with new fields:', sessionWithNewFields);
    } catch (newFieldsError) {
      console.log('⚠️  New fields not available, database needs migration');
      console.log('Error:', newFieldsError.message);
      
      // Try basic query
      const basicSession = await prisma.chatSession.findFirst({
        select: {
          id: true,
          title: true,
          createdAt: true,
          messageCount: true,
        },
      });
      console.log('Basic session query works:', basicSession);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testConnection()
    .then(() => {
      console.log('Database test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database test failed:', error);
      process.exit(1);
    });
}

module.exports = { testConnection };
