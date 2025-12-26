// One-time migration script to set parent fields on existing lists
// Run with: node scripts/migrate-list-parents.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

async function migrateListParents() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('Personal');
    const collection = db.collection('Lists');

    // Define parent-child relationships
    const parentMappings = {
      'Places': ['Cafes', 'Date Spots', 'Travel Destinations'],
      'Media': ['Books', 'Movies', 'TV Shows'],
    };

    // First, ensure parent lists exist
    for (const parentName of Object.keys(parentMappings)) {
      const exists = await collection.findOne({ name: parentName });
      if (!exists) {
        await collection.insertOne({
          name: parentName,
          list: [],
          parent: null
        });
        console.log(`Created parent list: ${parentName}`);
      } else {
        // Ensure parent field is null for parent lists
        await collection.updateOne(
          { name: parentName },
          { $set: { parent: null } }
        );
        console.log(`Updated parent list: ${parentName} (parent: null)`);
      }
    }

    // Update child lists with parent field
    for (const [parentName, children] of Object.entries(parentMappings)) {
      for (const childName of children) {
        const result = await collection.updateOne(
          { name: childName },
          { $set: { parent: parentName } }
        );
        
        if (result.matchedCount > 0) {
          console.log(`Updated ${childName} -> parent: ${parentName}`);
        } else {
          console.log(`List not found: ${childName} (will be created when first item is added)`);
        }
      }
    }

    // Ensure all other lists have parent: null
    await collection.updateMany(
      { parent: { $exists: false } },
      { $set: { parent: null } }
    );

    console.log('\nMigration completed successfully!');

    // Show current state
    const allLists = await collection.find({}).toArray();
    console.log('\nCurrent lists:');
    allLists.forEach(list => {
      console.log(`  - ${list.name} (parent: ${list.parent || 'none'})`);
    });

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

migrateListParents();

