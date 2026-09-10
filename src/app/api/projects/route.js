// app/api/projects/route.js
//
// Backed by Linear (not Mongo) since 2026-09-09 -- see src/utils/linear/client.js
// for the field-mapping notes. Request/response shapes here are unchanged from
// the old Mongo-backed version so PrjList.js, /projects/page.js,
// MilestoneList.tsx and MilestoneTrendComponent.js needed no changes.
import {
  getAllProjectsWithMilestones,
  addProject,
  addMilestoneToProject,
  updateMilestoneByName,
  updateProjectByRef,
  deleteMilestoneByName,
  deleteProjectByName,
} from '../../../utils/linear/client';

export const dynamic = 'force-dynamic';

export async function GET(req, res) {
  try {
    const projects = await getAllProjectsWithMilestones();
    return new Response(JSON.stringify(projects), { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch backlog' }), { status: 500 });
  }
}

export async function POST(req, res) {
  try {
    const { projectName, milestone, projectPriority, msName, projectType, projectNotes } = await req.json();

    if (projectName && projectPriority !== undefined && !milestone) {
      const result = await addProject(projectName, projectPriority, projectType, projectNotes);
      return new Response(JSON.stringify(result), { status: 201 });
    } else if (projectName && milestone) {
      const result = await addMilestoneToProject(projectName, milestone, msName);
      return new Response(JSON.stringify({ success: result }), { status: 201 });
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
    const { projectName, milestoneName, updatedMilestone, updates, updatedProject, projectId } = await req.json();
    // PrjList.js sends `updatedMilestone`; the /projects page's own inline
    // edit form sends `updates` -- accept either so both keep working.
    const milestoneUpdates = updatedMilestone || updates;

    if (projectId && milestoneName && milestoneUpdates) {
      const result = await updateMilestoneByName(projectId, milestoneName, milestoneUpdates);
      return new Response(JSON.stringify({ success: result }), { status: 200 });
    }

    if (projectName && milestoneName && milestoneUpdates) {
      const projects = await getAllProjectsWithMilestones();
      const project = projects.find((p) => p['Project Name'] === projectName);
      if (!project) throw new Error('Project not found');
      const result = await updateMilestoneByName(project._id, milestoneName, milestoneUpdates);
      return new Response(JSON.stringify({ success: result }), { status: 200 });
    }

    if (projectName && updatedProject) {
      const result = await updateProjectByRef(projectName, updatedProject);
      return new Response(JSON.stringify({ success: result }), { status: 200 });
    }

    if (projectId && updatedProject) {
      const result = await updateProjectByRef(projectId, updatedProject);
      return new Response(JSON.stringify({ success: result }), { status: 200 });
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

    if (projectId && milestoneName && !projectName) {
      const result = await deleteMilestoneByName(projectId, milestoneName);
      return new Response(JSON.stringify({ success: result }), { status: 200 });
    }

    if (!projectId && !milestoneName && projectName) {
      const result = await deleteProjectByName(projectName);
      return new Response(JSON.stringify({ success: result }), { status: 200 });
    }

    throw new Error('Missing required parameters for deletion');
  } catch (error) {
    console.error('Error deleting item:', error);
    return new Response(JSON.stringify({ error: 'Unable to delete item' }), { status: 500 });
  }
}
