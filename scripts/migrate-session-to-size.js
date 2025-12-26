// scripts/migrate-session-to-size.js
// Migration to convert Session field to Size field
// Session: Big → L, Next → M, Small → S
// Run with: node scripts/migrate-session-to-size.js "your-mongodb-uri"

const { MongoClient } = require('mongodb');

// Get MongoDB URI from command line argument
const MONGODB_URI = process.argv[2];

const SESSION_TO_SIZE = {
  'Big': 'L',
  'Next': 'M',
  'Small': 'S'
};

async function migrate() {
  if (!MONGODB_URI) {
    console.error('Missing MongoDB URI');
    console.log('Usage: node scripts/migrate-session-to-size.js "your-mongodb-uri"');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('Personal');
    const collection = db.collection('Backlog');

    // Update each session type to corresponding size
    for (const [session, size] of Object.entries(SESSION_TO_SIZE)) {
      const result = await collection.updateMany(
        { "Session": session },
        { 
          $set: { "Size": size },
          $unset: { "Session": "" }
        }
      );
      console.log(`Session "${session}" → Size "${size}": ${result.modifiedCount} tasks updated`);
    }

    // Handle any tasks without a Session field - default to M
    const noSessionResult = await collection.updateMany(
      { "Session": { $exists: false }, "Size": { $exists: false } },
      { $set: { "Size": "M" } }
    );
    console.log(`Tasks without Session (defaulted to M): ${noSessionResult.modifiedCount} tasks updated`);

    console.log('\nMigration complete!');

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

migrate();

