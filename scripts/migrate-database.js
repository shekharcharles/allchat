// Database migration script to add new fields to existing ChatSession documents
// Run this script to update existing chat sessions with new fields

const { MongoClient } = require('mongodb');

async function migrateDatabase() {
  const mongoUrl = process.env.DATABASE_URL?.replace('?directConnection=true', '') || 'mongodb://localhost:27017/t3';
  
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('t3');
    const collection = db.collection('ChatSession');
    
    // Check if any documents exist
    const count = await collection.countDocuments();
    console.log(`Found ${count} chat sessions to migrate`);
    
    if (count === 0) {
      console.log('No chat sessions to migrate');
      return;
    }
    
    // Update all existing chat sessions to include new fields with default values
    const updateResult = await collection.updateMany(
      {}, // Update all documents
      {
        $set: {
          description: null,
          tags: [],
          isTemplate: false,
          isShared: false,
          shareId: null,
          parentId: null,
          branchPoint: null,
          isArchived: false,
          isFavorite: false,
          category: 'general'
        }
      },
      {
        // Only set fields that don't already exist
        upsert: false
      }
    );
    
    console.log(`Migration completed. Modified ${updateResult.modifiedCount} documents`);
    
    // Verify the migration
    const sampleDoc = await collection.findOne({});
    console.log('Sample migrated document:', JSON.stringify(sampleDoc, null, 2));
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };
