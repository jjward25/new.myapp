// app/utils/mongoDB/routinesCRUD.js
import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';

export async function getBacklog() {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Routines');
  const backlog = await collection.find({}).toArray();
  return backlog;
}


export async function addRoutine(newRoutine) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Routines');
  try {
    const result = await collection.insertOne(newRoutine);
    return result.ops[0];  // Return the newly added routine
  } catch (error) {
    console.error('Error in addRoutine:', error);
    throw new Error('Failed to insert routine into database.');
  }
}


export async function updateItem(id, updatedItem) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Routines');
  const { _id, ...fieldsToUpdate } = updatedItem;
  const result = await collection.updateOne({ _id: id }, { $set: fieldsToUpdate });
  return result;
}

export async function deleteItem(id) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Routines');
  const result = await collection.deleteOne({ _id: id });
  return result;
}

export async function getMostRecentRoutine() {
  const client = await clientPromise;
  const db = client.db('Personal');
  const mostRecentRoutine = await db
    .collection('Routines')
    .find({})
    .sort({ Date: -1 }) // Sort by Date in descending order
    .limit(2)
    .toArray();
  return mostRecentRoutine;
}

