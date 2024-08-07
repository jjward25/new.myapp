// src/utils/mongoDB/prjCRUD.js
import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';

export async function getBacklog() {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');
  const backlog = await collection.find({}).toArray();
  return backlog;
}

export async function addItem(projectName, milestone) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');
  
  // Add the milestone to the specified project
  const result = await collection.updateOne(
    { "Project Name": projectName },
    { $set: { [`Milestones.${milestone.milestoneName}`]: milestone } }
  );
  
  return result;
}

export async function updateItem(id, updatedItem) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');
  const { _id, ...fieldsToUpdate } = updatedItem;
  const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: fieldsToUpdate });
  return result;
}

export const deleteItem = async (projectId, milestoneName) => {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');

  if (!ObjectId.isValid(projectId)) {
    throw new Error('Invalid project ID');
  }

  console.log(`Deleting milestone ${milestoneName} from project ${projectId}`);

  const result = await collection.updateOne(
    { _id: new ObjectId(projectId) },
    { $unset: { [`Milestones.${milestoneName}`]: "" } }
  );

  if (result.modifiedCount === 0) {
    throw new Error('No documents matched the query. Deletion may have failed.');
  }

  return result;
};

export const deleteProject = async (projectName) => {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');

  const result = await collection.deleteOne({ "Project Name": projectName });

  if (result.deletedCount === 0) {
    throw new Error('No documents matched the query. Deletion may have failed.');
  }

  return result;
};


// src/utils/mongoDB/prjCRUD.js
export async function addProject(projectName, projectPriority) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');

  // Validate inputs
  if (!projectName || !projectPriority) {
    throw new Error('Missing project name or priority');
  }

  // Add a new project with an empty milestones array
  const result = await collection.insertOne({
    "Project Name": projectName,
    "Project Priority": projectPriority,
    Milestones: {}
  });

  return result;
}
