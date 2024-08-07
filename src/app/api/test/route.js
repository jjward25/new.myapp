// src/app/api/projects/route.js

import clientPromise from '../../../lib/mongodb'; // Adjust the import path if necessary
import { ObjectId } from 'mongodb';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId'); // Expecting projectId as query parameter

  if (!projectId) {
    return new Response('Project ID is required', { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('your-database-name'); // Replace with your database name
    const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });

    console.log('Project data:', project); // Log the project data to the console

    return new Response(JSON.stringify(project), { status: 200 });
  } catch (error) {
    console.error('Error fetching project:', error);
    return new Response('Error fetching project', { status: 500 });
  }
}
