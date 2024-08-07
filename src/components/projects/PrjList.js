// src/components/projects/PrjList.js

'use client'; // Ensure this component runs in the client
import React, { useState, useEffect } from 'react';
import MilestoneCard from './MilestoneCard';
import { type } from 'os';

const PrjList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('priority'); // 'priority' or 'date'
  const [dateOrder, setDateOrder] = useState('asc'); // 'asc' or 'desc'
  const [priorityOrder, setPriorityOrder] = useState('asc'); // 'asc' or 'desc'

  const [isEditing, setIsEditing] = useState(false);
  const [editProjectData, setEditProjectData] = useState({
    projectName: '',
    projectPriority: '',
    type: '',
    notes: ''
  });
  const [currentProjectId, setCurrentProjectId] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      const transformedProjects = data.map((project) => ({
        _id: project._id, // Ensure _id is included
        projectName: project["Project Name"],
        projectPriority: project["Project Priority"],
        type: project["Type"],
        notes: project["Notes"],
        milestones: Object.entries(project.Milestones).map(([milestoneName, milestone]) => ({
          ...milestone,
          milestoneName,
        })),
      }));

      setProjects(transformedProjects);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Unable to fetch projects');
      setLoading(false);
    }
  };

  const handleAddMilestone = async (projectName) => {
    const milestoneName = prompt("Enter the new milestone name:");
    if (milestoneName) {
      const msName = milestoneName;
      const milestoneDetails = {
        "Milestone Priority": prompt("Enter the milestone priority:") || null,
        "Start Date": prompt("Enter the start date:") || null,
        "Due Date": prompt("Enter the due date:") || null,
        "Complete Date": prompt("Enter the complete date:") || null,
        "Estimated Size": prompt("Enter the estimated size:") || null,
        "Actual Hours": prompt("Enter the actual hours:") || null,
        Notes: prompt("Enter notes:") || null,
        Target: prompt("Enter the target:") || null,
        Actual: prompt("Enter the actual:") || null,
      };

      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectName, milestone: milestoneDetails,msName }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        // Refetch projects to update state
        fetchProjects();
      } catch (error) {
        console.error('Error adding milestone:', error);
        setError('Unable to add milestone');
      }
    }
  };

  const handleEditMilestone = async (editedMilestone) => {
    try {
      const project = projects.find(p => p.milestones.some(m => m.milestoneName === editedMilestone.milestoneName));
      if (!project) {
        throw new Error('Project not found');
      }
  
      const projectId = project._id.toString();
  
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          milestoneName: editedMilestone.milestoneName, // Include milestoneName
          updatedMilestone: {
            ...editedMilestone,
            milestoneName: undefined, // Do not include `milestoneName` in the update payload
          },
        }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      fetchProjects();
    } catch (error) {
      console.error('Error editing milestone:', error);
      setError('Unable to edit milestone');
    }
  };
  
  const handleDeleteMilestone = async (milestone) => {
    try {
      const project = projects.find(p => p.milestones.some(m => m.milestoneName === milestone.milestoneName));
      if (!project) {
        throw new Error('Project not found');
      }

      const projectId = project._id.toString();

      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          milestoneName: milestone.milestoneName
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Refetch projects to update state
      fetchProjects();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      setError('Unable to delete milestone');
    }
  };

  const handleDeleteProject = async (projectName) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectName }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Update the projects state after deletion
      const updatedProjects = projects.filter((project) => project.projectName !== projectName);
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Unable to delete project');
    }
  };

  const handleEditProject = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: editProjectData.projectName, // Use projectName to find the project
          updatedProject: {
            "Project Name": editProjectData.projectName,
            "Project Priority": editProjectData.projectPriority,
            "Type": editProjectData.type,
            "Notes": editProjectData.notes,
          }
        }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      fetchProjects();
      setIsEditing(false); // Close the edit form
    } catch (error) {
      console.error('Error editing project:', error);
      setError('Unable to edit project');
    }
  };
  
  
  
  
  
  
  
  const handleOpenEditForm = (project) => {
    setEditProjectData({
      projectName: project.projectName || '',
      projectPriority: project.projectPriority || '',
      type: project.type || '',
      notes: project.notes || ''
    });
    setCurrentProjectId(project._id.toString()); // Ensure the ID is set
    setIsEditing(true);
  };
  

  const sortMilestones = (milestones) => {
    if (sortOrder === 'date') {
      return milestones.sort((a, b) => {
        const dateA = new Date(a["Due Date"]);
        const dateB = new Date(b["Due Date"]);
        return dateOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    return milestones.sort((a, b) => priorityOrder === 'asc' ? a["Milestone Priority"] - b["Milestone Priority"] : b["Milestone Priority"] - a["Milestone Priority"]);
  };

  const sortedProjects = projects.sort((b, a) => b.projectPriority - a.projectPriority);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
  <div className="container mx-auto md:px-0 md:h-auto">
    {sortedProjects.map((project) => {
      const sortedMilestones = sortMilestones(project.milestones);

      return (
        <div key={project._id} className="flex flex-col mb-6 max-w-[750px] mx-auto w-full h-full">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">
              {project.projectName}
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={() => handleOpenEditForm(project)}
                className="px-3 py-1 bg-yellow-500 text-white rounded-lg"
              >
                Edit Project
              </button>
              <button
                onClick={() => handleDeleteProject(project.projectName)}
                className="px-3 py-1 bg-red-500 text-white rounded-lg"
              >
                Delete Project
              </button>
              <button
                onClick={() => handleAddMilestone(project.projectName)}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg"
              >
                Add Milestone
              </button>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px] mb-3"></div>

          <div className="flex flex-row w-auto justify-start overflow-auto space-0 disable-scrollbars">
            {sortedMilestones.map((milestone, index) => (
              <div key={index} className="flex flex-col w-full max-w-[350px] mr-6 mb-4 h-full">
                <div className="flex flex-row flex-wrap space-4 h-full">
                  <MilestoneCard 
                    milestone={milestone} 
                    handleDeleteMilestone={() => handleDeleteMilestone(milestone)} 
                    handleEditMilestone={handleEditMilestone}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })}

    {/* Edit Project Form */}
    {isEditing && (
  <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-75">
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Edit Project</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleEditProject(); }}>
      <label className="block mb-2">
          Project Name:
          <input
            type="text"
            value={editProjectData.projectName}
            onChange={(e) => setEditProjectData(prev => ({ ...prev, projectName: e.target.value }))}
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
        </label>
        <label className="block mb-2">
          Project Priority:
          <input
            type="number"
            value={editProjectData.projectPriority}
            onChange={(e) => setEditProjectData(prev => ({ ...prev, projectPriority: e.target.value }))}
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
        </label>
        <label className="block mb-2">
          Type:
          <input
            type="text"
            value={editProjectData.type}
            onChange={(e) => setEditProjectData(prev => ({ ...prev, type: e.target.value }))}
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
        </label>
        <label className="block mb-4">
          Notes:
          <textarea
            value={editProjectData.notes}
            onChange={(e) => setEditProjectData(prev => ({ ...prev, notes: e.target.value }))}
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
        </label>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg ml-2"
        >
          Cancel
        </button>
      </form>
    </div>
  </div>
)}

  </div>
);
};

export default PrjList;
