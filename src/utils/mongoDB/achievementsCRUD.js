// src/utils/mongoDB/achievementsCRUD.js
import clientPromise from './mongoConnect';

const DEFAULT_USER_ID = 'default';

// Get or create achievement levels document
export async function getAchievementLevels() {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Achievements');
  
  let levels = await collection.findOne({ userId: DEFAULT_USER_ID });
  
  // Create default document if it doesn't exist
  if (!levels) {
    const defaultLevels = {
      userId: DEFAULT_USER_ID,
      projectsLevel: 0,
      routinesLevel: 0,
      workoutsLevel: 0,
      lastWeeklyWorkoutWeek: null // Track which week was last completed
    };
    await collection.insertOne(defaultLevels);
    levels = defaultLevels;
  }
  
  return levels;
}

// Increment a specific level pool
export async function incrementLevel(pool) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Achievements');
  
  const fieldName = `${pool}Level`;
  
  const result = await collection.findOneAndUpdate(
    { userId: DEFAULT_USER_ID },
    { $inc: { [fieldName]: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  
  return result[fieldName];
}

// Increment projects level
export async function incrementProjectsLevel() {
  return incrementLevel('projects');
}

// Increment routines level
export async function incrementRoutinesLevel() {
  return incrementLevel('routines');
}

// Increment workouts level
export async function incrementWorkoutsLevel() {
  return incrementLevel('workouts');
}

// Check and mark weekly workout as complete (prevents double-counting)
export async function checkAndMarkWeeklyWorkout(weekIdentifier) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Achievements');
  
  const levels = await collection.findOne({ userId: DEFAULT_USER_ID });
  
  // Check if this week was already completed
  if (levels && levels.lastWeeklyWorkoutWeek === weekIdentifier) {
    return { alreadyCompleted: true, level: levels.workoutsLevel };
  }
  
  // Mark this week as completed and increment level
  const result = await collection.findOneAndUpdate(
    { userId: DEFAULT_USER_ID },
    { 
      $inc: { workoutsLevel: 1 },
      $set: { lastWeeklyWorkoutWeek: weekIdentifier }
    },
    { returnDocument: 'after', upsert: true }
  );
  
  return { alreadyCompleted: false, level: result.workoutsLevel };
}

