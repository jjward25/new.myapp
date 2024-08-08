// app/api/projects/route.js
import { ObjectId } from 'mongodb';
import { getBacklog, addItem, updateMilestone, deleteItem, deleteProject, updateProject, addProject, getProjectById } from '../../../utils/mongoDB/prjCRUD';

export const dynamic = 'force-dynamic';

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
    const { projectName, milestone, projectPriority, msName, projectType, projectNotes } = await req.json();

    if (projectName && projectPriority) {
      // Add a new project
      const result = await addProject(projectName, projectPriority, projectType, projectNotes);
      return new Response(JSON.stringify(result), { status: 201 });
    } else if (projectName && milestone) {
      // Add milestone to existing project
      const result = await addItem(projectName, milestone, msName);
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
    const { projectName, milestoneName, updatedMilestone, updatedProject, projectId } = await req.json();

    if (projectName) {
      // If projectName is provided, check if it's for updating milestone or project
      if (milestoneName && updatedMilestone) {
        // Update Milestone
        const project = await getProjectByName(projectName);
        if (!project) {
          throw new Error('Project not found');
        }

        const result = await updateMilestone(project._id.toString(), milestoneName, updatedMilestone);
        return new Response(JSON.stringify(result), { status: 200 });
      }

      if (updatedProject) {
        // Update Project
        const result = await updateProject(projectName, updatedProject);
        return new Response(JSON.stringify(result), { status: 200 });
      }
    }

    if (projectId) {
      // If projectId is provided, handle updates for milestone or project
      if (milestoneName && updatedMilestone) {
        if (!ObjectId.isValid(projectId)) {
          throw new Error('Invalid project ID');
        }
        const result = await updateMilestone(projectId, milestoneName, updatedMilestone);
        return new Response(JSON.stringify(result), { status: 200 });
      }

      if (updatedProject) {
        if (!ObjectId.isValid(projectId)) {
          throw new Error('Invalid project ID');
        }

        const currentProject = await getProjectById(projectId);
        if (!currentProject) {
          throw new Error('Project not found');
        }

        // Only include fields that are part of the updatedProject
        const validFields = ['Project Name', 'Project Priority', 'Type', 'Notes'];
        const updateFields = {};

        validFields.forEach(field => {
          if (updatedProject[field] !== undefined) {
            updateFields[field] = updatedProject[field];
          }
        });

        if (Object.keys(updateFields).length === 0) {
          throw new Error('No valid fields to update');
        }

        const result = await updateProject(projectId, updateFields);
        return new Response(JSON.stringify(result), { status: 200 });
      }
    }

    throw new Error('Missing required parameters for update');
  } catch (error) {
    console.error('Error updating item:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
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



