// scripts/migrate-missed-tasks.js
// One-time migration to mark existing overdue incomplete tasks as Missed=true
// Run with: node scripts/migrate-missed-tasks.js "your-mongodb-uri"

const { MongoClient } = require('mongodb');

// Get MongoDB URI from command line argument
const MONGODB_URI = process.argv[2];

async function migrate() {
  if (!MONGODB_URI) {
    console.error('Missing MongoDB URI');
    console.log('Usage: node scripts/migrate-missed-tasks.js "your-mongodb-uri"');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('Personal');
    const collection = db.collection('Backlog');

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`Today's date: ${todayStr}`);
    console.log('Finding incomplete tasks with Due Date before today...');

    // Update all incomplete tasks with Due Date before today to have Missed: true
    const result = await collection.updateMany(
      {
        "Due Date": { $lt: todayStr },
        "Complete Date": null,
        "Missed": { $ne: true }  // Only update if not already marked
      },
      { $set: { "Missed": true } }
    );

    console.log(`Migration complete!`);
    console.log(`  Matched: ${result.matchedCount} tasks`);
    console.log(`  Modified: ${result.modifiedCount} tasks`);

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

migrate();

