// Database setup script to ensure proper MongoDB configuration
const { MongoClient } = require('mongodb');

async function setupDatabase() {
  // Try different connection strings to find the working one
  const connectionStrings = [
    'mongodb://localhost:27017/t3',
    'mongodb://127.0.0.1:27017/t3',
    'mongodb://localhost:27017/t3?directConnection=true',
  ];

  let client;
  let workingConnectionString;

  console.log('Setting up database connection...');

  for (const connectionString of connectionStrings) {
    try {
      console.log(`Trying connection: ${connectionString}`);
      client = new MongoClient(connectionString);
      await client.connect();
      
      // Test the connection
      await client.db('t3').admin().ping();
      workingConnectionString = connectionString;
      console.log(`✅ Successfully connected with: ${connectionString}`);
      break;
    } catch (error) {
      console.log(`❌ Failed to connect with: ${connectionString}`);
      console.log(`   Error: ${error.message}`);
      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
      client = null;
    }
  }

  if (!client || !workingConnectionString) {
    console.error('❌ Could not establish database connection with any connection string');
    console.log('\n📋 Troubleshooting steps:');
    console.log('1. Make sure MongoDB is running on your system');
    console.log('2. Check if MongoDB is listening on port 27017');
    console.log('3. Try starting MongoDB with: mongod --dbpath /path/to/your/db');
    console.log('4. Or install MongoDB if not already installed');
    return false;
  }

  try {
    const db = client.db('t3');
    
    // Check existing collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📊 Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Ensure required collections exist
    const requiredCollections = ['User', 'Account', 'Session', 'ChatSession', 'ChatMessage'];
    
    for (const collectionName of requiredCollections) {
      const exists = collections.some(col => col.name === collectionName);
      if (!exists) {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } else {
        console.log(`✅ Collection exists: ${collectionName}`);
      }
    }

    // Check if ChatSession collection has the new fields
    const chatSessionCollection = db.collection('ChatSession');
    const sampleSession = await chatSessionCollection.findOne({});
    
    if (sampleSession) {
      console.log('\n🔍 Checking ChatSession schema...');
      const hasNewFields = [
        'description', 'tags', 'isTemplate', 'isShared', 
        'isArchived', 'isFavorite', 'category'
      ].every(field => field in sampleSession);
      
      if (hasNewFields) {
        console.log('✅ ChatSession collection has all new fields');
      } else {
        console.log('⚠️  ChatSession collection needs migration for new fields');
        console.log('   Run: node scripts/migrate-database.js');
      }
    } else {
      console.log('ℹ️  No chat sessions found - this is normal for a new installation');
    }

    // Update .env file with working connection string
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update the DATABASE_URL line
      const newDatabaseUrl = `DATABASE_URL=${workingConnectionString}`;
      envContent = envContent.replace(/^DATABASE_URL=.*$/m, newDatabaseUrl);
      
      fs.writeFileSync(envPath, envContent);
      console.log(`\n✅ Updated .env file with working connection string: ${workingConnectionString}`);
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. If you have existing chat sessions, run: node scripts/migrate-database.js');
    console.log('3. Your application should now work properly');

    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
