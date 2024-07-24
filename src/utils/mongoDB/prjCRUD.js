// lib/crud.js
import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';

export async function getBacklog() {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');
  const backlog = await collection.find({}).toArray();
  return backlog;
}

export async function addItem(item) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');
  const result = await collection.insertOne(item);
  return result;
}

export async function updateItem(id, updatedItem) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');
  const { _id, ...fieldsToUpdate } = updatedItem;
  const result = await collection.updateOne({ _id: id }, { $set: fieldsToUpdate });
  return result;
}

export async function deleteItem(id) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');
  const result = await collection.deleteOne({ _id: id });
  return result;
}
