// src/utils/mongoDB/simpleWorkoutCRUD.js
import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';

// Get all simple workouts
export async function getSimpleWorkouts() {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Workouts');
  
  // Get the document and filter for simple type workouts
  const workoutData = await collection.find({}).toArray();
  if (!workoutData.length) return [];
  
  const allWorkouts = workoutData[0]?.Workouts || [];
  return allWorkouts.filter(w => w.Type === 'simple');
}

// Get today's simple workout
export async function getTodaysSimpleWorkout(date) {
  const workouts = await getSimpleWorkouts();
  return workouts.find(w => w.Date === date) || null;
}

// Add exercise to today's workout (creates workout if doesn't exist)
export async function addExerciseToWorkout(date, exercise) {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');
    const collection = db.collection('Workouts');
    
    // Check if today's simple workout exists
    const existingWorkout = await getTodaysSimpleWorkout(date);
    
    if (existingWorkout) {
      // Add exercise to existing workout
      // Use $elemMatch to ensure both conditions match the same array element
      const result = await collection.updateOne(
        { "Workouts": { $elemMatch: { Date: date, Type: "simple" } } },
        { 
          $push: { 
            "Workouts.$.Exercises": {
              ...exercise,
              _id: new ObjectId()
            }
          }
        }
      );
      return result;
    } else {
      // Create new workout for today
      const newWorkout = {
        _id: new ObjectId(),
        Type: "simple",
        Date: date,
        Exercises: [{
          ...exercise,
          _id: new ObjectId()
        }]
      };
      
      const result = await collection.updateOne(
        {},
        { $push: { "Workouts": newWorkout } },
        { upsert: true }
      );
      return result;
    }
  } catch (error) {
    console.error('Error adding exercise to workout:', error);
    throw error;
  }
}

// Delete exercise from workout
export async function deleteExercise(date, exerciseId) {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');
    const collection = db.collection('Workouts');
    
    // Use $elemMatch to ensure both conditions match the same array element
    const result = await collection.updateOne(
      { "Workouts": { $elemMatch: { Date: date, Type: "simple" } } },
      { 
        $pull: { 
          "Workouts.$.Exercises": { _id: new ObjectId(exerciseId) }
        }
      }
    );
    
    return result;
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw error;
  }
}

// Delete entire workout by date
export async function deleteSimpleWorkout(date) {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');
    const collection = db.collection('Workouts');
    
    const result = await collection.updateOne(
      {},
      { 
        $pull: { 
          "Workouts": { Date: date, Type: "simple" }
        }
      }
    );
    
    return result;
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

