// src/utils/mongoDB/calendarCRUD.js
import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';

export async function getWorkout() {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Workouts');
  const backlog = await collection.find({}).toArray();
  return backlog;
}

export async function addWorkout(item) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Workouts');
  const result = await collection.insertOne(item);
  return result;
}

export async function updateWorkout(date, exercises) {
  try {
    const client = await clientPromise;
    const database = client.db('Personal');
      const workoutsCollection = database.collection('Workouts');

      const result = await workoutsCollection.updateOne(
          { Date: date },
          { $set: { Exercises: exercises } }
      );

      return result;
  } catch (error) {
      console.error('Error updating workout in MongoDB:', error);
      throw error; // Ensure to throw error for higher-level handling
  } finally {
      await client.close();
  }
}

export async function deleteWorkout(id) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Workouts');
  const result = await collection.deleteOne({ _id: id });
  return result;
}

