// app/utils/mongoDB/routinesCRUD.js
import clientPromise from './mongoConnect';
import { APP_DB } from './dbName';
import { ObjectId } from 'mongodb';

export async function getBacklog() {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('Routines');
  const backlog = await collection.find({}).toArray();
  return backlog;
}

export async function addRoutine(newRoutine) {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('Routines');
  try {
    const result = await collection.insertOne(newRoutine);
    return { 
      ...newRoutine, 
      _id: result.insertedId 
    };
  } catch (error) {
    console.error('Error in addRoutine:', error);
    throw error;
  }
}

export async function updateItem(id, updatedItem) {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('Routines');
  const { _id, ...fieldsToUpdate } = updatedItem;
  const result = await collection.updateOne({ _id: id }, { $set: fieldsToUpdate });
  return result;
}

export async function getRoutineById(id) {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('Routines');
  return collection.findOne({ _id: id });
}

export async function deleteItem(id) {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('Routines');
  const result = await collection.deleteOne({ _id: id });
  return result;
}

export async function getMostRecentRoutine() {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const mostRecentRoutine = await db
    .collection('Routines')
    .find({})
    .sort({ Date: -1 }) // Sort by Date in descending order
    .limit(1)
    .toArray();
  return mostRecentRoutine;
}

