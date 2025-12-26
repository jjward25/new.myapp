// scripts/clear-routines.js
// Clears all existing routines data to start fresh with new structure
// Run with: node scripts/clear-routines.js "your-mongodb-uri"

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.argv[2];

async function clearRoutines() {
  if (!MONGODB_URI) {
    console.error('Missing MongoDB URI');
    console.log('Usage: node scripts/clear-routines.js "your-mongodb-uri"');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('Personal');
    const collection = db.collection('Routines');

    // Count existing documents
    const count = await collection.countDocuments();
    console.log(`Found ${count} existing routine entries`);

    // Delete all documents
    const result = await collection.deleteMany({});
    console.log(`Deleted ${result.deletedCount} routine entries`);

    console.log('Routines collection cleared successfully!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

clearRoutines();

