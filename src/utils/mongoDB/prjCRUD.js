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

export async function addItem(projectName, milestone, msName) {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');
  
  // Add the milestone to the specified project
  const result = await collection.updateOne(
    { "Project Name": projectName },
    { $set: { [`Milestones.${msName}`]: milestone } }
  );
  
  return result;
}

export const updateMilestone = async (projectId, milestoneName, updates) => {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');

  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(projectId), [`Milestones.${milestoneName}`]: { $exists: true } },
      { $set: { [`Milestones.${milestoneName}`]: updates } }
    );

    if (result.matchedCount === 0) {
      throw new Error('No documents matched the query. Update may have failed.');
    }

    return result;
  } catch (error) {
    console.error('Error updating milestone:', error);
    throw error;
  }
};





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


export const updateProject = async (projectName, updates) => {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');

  try {
    const result = await collection.updateOne(
      { "Project Name": projectName },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      throw new Error('No documents matched the query. Update may have failed.');
    }

    return result;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
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


export async function addProject(projectName, projectPriority,projectType,projectNotes) {
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
    "Type": projectType,
    "Notes": projectNotes,
    Milestones: {}
  });

  return result;
}

export const getProjectByName = async (projectName) => {
  const client = await clientPromise;
  const db = client.db('Personal');
  const collection = db.collection('Projects');

  try {
    const project = await collection.findOne({ "Project Name": projectName });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  } catch (error) {
    console.error('Error retrieving project:', error);
    throw error;
  }
};