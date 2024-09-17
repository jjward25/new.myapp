// src/utils/mongoDB/calendarCRUD.js
import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';

export async function getCalendarEvents() {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Calendar');
  const backlog = await collection.find({}).toArray();
  return backlog;
}

export async function addEvent(item) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Calendar');
  const result = await collection.insertOne(item);
  return result;
}

export async function updateEvent(id, updatedItem) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Calendar');

  // Validate ObjectId
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid ObjectId format');
  }

  const objectId = new ObjectId(id);
  const { _id, ...fieldsToUpdate } = updatedItem;
  
  // Ensure _id is not included in the update
  const result = await collection.updateOne({ _id: objectId }, { $set: fieldsToUpdate });
  return result;
}

export async function deleteEvent(id) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Calendar');
  const result = await collection.deleteOne({ _id: id });
  return result;
}
