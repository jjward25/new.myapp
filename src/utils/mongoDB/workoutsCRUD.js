// src/utils/mongoDB/workoutsCRUD.js
import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';

export async function getWorkoutData() {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Workouts');
  const workoutData = await collection.find({}).toArray();
  return workoutData.length > 0 ? workoutData[0] : null; // Return the first document
}

export async function getWorkout() {
  const workoutData = await getWorkoutData();
  return workoutData?.Workouts || [];
}

export async function getWorkoutTemplates() {
  const workoutData = await getWorkoutData();
  return workoutData?.Templates || null;
}

export async function getTodaysWorkout(date) {
  const workouts = await getWorkout();
  return workouts.find(workout => workout.Date === date) || null;
}

export async function addWorkout(item) {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');
    const collection = db.collection('Workouts');
    
    // Add the workout to the Workouts array in the document
    const result = await collection.updateOne(
      {}, // Find the first document
      { 
        $push: { 
          "Workouts": {
            ...item,
            _id: new ObjectId()
          }
        }
      },
      { upsert: true }
    );
    
    return result;
  } catch (error) {
    console.error('Error adding workout:', error);
    throw error;
  }
}

export async function updateWorkout(workoutId, updateData) {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');
    const collection = db.collection('Workouts');
    
    const result = await collection.updateOne(
      { "Workouts._id": new ObjectId(workoutId) },
      { $set: { "Workouts.$": { ...updateData, _id: new ObjectId(workoutId) } } }
    );
    
    return result;
  } catch (error) {
    console.error('Error updating workout in MongoDB:', error);
    throw error;
  }
}

export async function updateWorkoutByDate(date, exercises) {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');
    const collection = db.collection('Workouts');

    const result = await collection.updateOne(
      { "Workouts.Date": date },
      { $set: { "Workouts.$.Exercises": exercises } }
    );

    return result;
  } catch (error) {
    console.error('Error updating workout by date in MongoDB:', error);
    throw error;
  }
}

export async function deleteWorkout(workoutId) {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');
    const collection = db.collection('Workouts');
    
    const result = await collection.updateOne(
      {},
      { $pull: { "Workouts": { "_id": new ObjectId(workoutId) } } }
    );
    
    return result;
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

export async function addSetToWorkout(workoutId, exerciseName, setData) {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');
    const collection = db.collection('Workouts');
    
    const result = await collection.updateOne(
      { "Workouts._id": new ObjectId(workoutId) },
      { $push: { [`Workouts.$.Exercises.${exerciseName}.Sets`]: setData } }
    );
    
    return result;
  } catch (error) {
    console.error('Error adding set to workout:', error);
    throw error;
  }
}

