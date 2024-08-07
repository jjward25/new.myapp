// app/api/projects/route.js
import { ObjectId } from 'mongodb';
import { getBacklog, addItem, updateItem, deleteItem, deleteProject, addProject } from '../../../utils/mongoDB/prjCRUD';

export async function GET(req, res) {
  try {
    const backlog = await getBacklog();
    return new Response(JSON.stringify(backlog), { status: 200 });
  } catch (error) {
    console.error('Error fetching backlog:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch backlog' }), { status: 500 });
  }
}

export async function POST(req, res) {
  try {
    const { projectName, milestone, projectPriority } = await req.json();

    if (projectName && projectPriority) {
      // Add a new project
      const result = await addProject(projectName, projectPriority);
      return new Response(JSON.stringify(result), { status: 201 });
    } else if (projectName && milestone) {
      // Add milestone to existing project
      const result = await addItem(projectName, milestone);
      return new Response(JSON.stringify(result), { status: 201 });
    } else {
      throw new Error('Missing projectName or milestone');
    }
  } catch (error) {
    console.error('Error adding item:', error.message);
    return new Response(JSON.stringify({ error: 'Unable to add item' }), { status: 500 });
  }
}



export async function PUT(req, res) {
  try {
    const { id, updatedItem } = await req.json();
    const result = await updateItem(id, updatedItem);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error updating item:', error);
    return new Response(JSON.stringify({ error: 'Unable to update item' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { projectId, milestoneName, projectName } = await req.json();

    // Handle milestone deletion
    if (projectId && milestoneName && !projectName) {
      if (!ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID');
      }
      const result = await deleteItem(projectId, milestoneName);
      return new Response(JSON.stringify(result), { status: 200 });
    }

    // Handle project deletion
    if (!projectId && !milestoneName && projectName) {
      const result = await deleteProject(projectName);
      return new Response(JSON.stringify(result), { status: 200 });
    }

    throw new Error('Missing required parameters for deletion');
  } catch (error) {
    console.error('Error deleting item:', error);
    return new Response(JSON.stringify({ error: 'Unable to delete item' }), { status: 500 });
  }
}



