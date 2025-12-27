// src/components/projects/PrjList.js
'use client'; // Ensure this component runs in the client
import React, { useState, useEffect } from 'react';
import MilestoneCard from './MilestoneCard';
import { triggerAchievementAnimation } from '@/components/animations/GlobalAnimationProvider';

const PrjList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('priority'); // 'priority' or 'date'
  const [dateOrder, setDateOrder] = useState('asc'); // 'asc' or 'desc'
  const [priorityOrder, setPriorityOrder] = useState('asc'); // 'asc' or 'desc'
  const [openProjects, setOpenProjects] = useState({}); // Object to track open/closed state

  // Edit Project State
  const [isEditing, setIsEditing] = useState(false);
  const [editProjectData, setEditProjectData] = useState({
    projectName: '',
    projectPriority: '',
    type: '',
    notes: ''
  });

  // Add Milestone State
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestoneData, setNewMilestoneData] = useState({
    milestoneName: '',
    priority: '',
    startDate: '',
    dueDate: '',
    completeDate: '',
    estimatedSize: '',
    actualHours: '',
    notes: '',
    target: '',
    actual: ''
  });
  const [currentProjectName, setCurrentProjectName] = useState('');
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
      const transformedProjects = data.filter(project => !project["Project Complete Date"]).map((project) => ({
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

  const handleAddMilestoneForm = (projectName) => {
    setCurrentProjectName(projectName);
    setIsAddingMilestone(true);
  };

  const handleSubmitMilestone = async (e) => {
    e.preventDefault();
    const milestoneDetails = {
      "Milestone Priority": newMilestoneData.priority,
      "Start Date": newMilestoneData.startDate,
      "Due Date": newMilestoneData.dueDate,
      "Complete Date": newMilestoneData.completeDate,
      "Estimated Size": newMilestoneData.estimatedSize,
      "Actual Hours": newMilestoneData.actualHours,
      Notes: newMilestoneData.notes,
      Target: newMilestoneData.target,
      Actual: newMilestoneData.actual,
    };

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectName: currentProjectName, milestone: milestoneDetails, msName: newMilestoneData.milestoneName }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Refetch projects to update state
      fetchProjects();
      setIsAddingMilestone(false); // Close the form
    } catch (error) {
      console.error('Error adding milestone:', error);
      setError('Unable to add milestone');
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

  const handleCompleteProject = async (projectName) => {
    const completeDate = new Date().toISOString(); // Gets today's date in ISO format

    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          updatedProject: {
            "Project Complete Date": completeDate // Assuming your JSON structure has a "Complete Date" field
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Increment projects achievement level
      try {
        const achieveResponse = await fetch('/api/achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pool: 'projects' }),
        });
        if (achieveResponse.ok) {
          const { level } = await achieveResponse.json();
          // Trigger global achievement animation
          triggerAchievementAnimation('📝🤓 Project Complete! 🤓📝', level);
        }
      } catch (achieveError) {
        console.error('Error incrementing achievement:', achieveError);
      }

      // Refetch projects to update state
      fetchProjects();
    } catch (error) {
      console.error('Error completing project:', error);
      setError('Unable to complete project');
    }
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

 

  const toggleOpen = (projectId) => {
    setOpenProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const filterMilestones = (milestones) => {
    return milestones.filter(milestone => !milestone["Complete Date"] || milestone["Complete Date"] === '');
  };


  const sortedProjects = projects.sort((b, a) => b.projectPriority - a.projectPriority);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto md:px-0 md:h-auto">
      {sortedProjects.map((project) => {
        const sortedMilestones = sortMilestones(filterMilestones(project.milestones));
        
        // Define a class for the project name based on its value
        const projectNameClass = project.projectName === "Weekly Goals"
          ? "text-neutral-300 font-normal"
          : project.projectName === "Annual Goals"
          ? "text-neutral-300 font-normal"
          : "text-amber-400"; // default styling

        return (
          <div key={project._id} className="flex flex-col mb-1 max-w-[750px] mx-auto w-full h-full">
            <div className="bg-cyan-950 px-2 pl-3 rounded-lg flex justify-between items-center flex-col md:flex-row mb-3 cursor-pointer" onClick={() => toggleOpen(project._id)}>
              <h1 className={`text-xl md:text-2xl ${projectNameClass} mb-2 pt-2 font-semibold`}>
                {project.projectName}
              </h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOpenEditForm(project)}
                  className="px-3 py-1 bg-yellow-800 text-white rounded-lg hover:scale-95 text-xs hover:bg-yellow-700"
                >
                  Edit Project
                </button>
                <button
                  onClick={() => handleDeleteProject(project.projectName)}
                  className="px-3 py-1 bg-red-800 text-white rounded-lg hover:scale-95 text-xs hover:bg-red-700"
                >
                  Delete Project
                </button>
                <button
                  onClick={() => handleAddMilestoneForm(project.projectName)}
                  className="px-3 py-1 bg-blue-800 text-white rounded-lg hover:scale-95 text-xs hover:bg-blue-700"
                >
                  Add Milestone
                </button>
                <button
                  onClick={() => handleCompleteProject(project.projectName)} // Call complete function
                  className="px-3 py-1 bg-green-800 text-white rounded-lg hover:scale-95 text-xs hover:bg-green-700"
                >
                  Complete Project
                </button>
              </div>
            </div>

            {openProjects[project._id] && (
              <div className={`flex flex-row w-auto justify-start overflow-auto disable-scrollbars`}>
                {sortedMilestones.map((milestone, index) => (
                  <div key={index} className={`flex flex-col w-auto mr-6 mb-1 h-full`}>
                    <div className="flex flex-row flex-wrap h-full">
                      <MilestoneCard 
                        milestone={milestone} 
                        handleDeleteMilestone={() => handleDeleteMilestone(milestone)} 
                        handleEditMilestone={handleEditMilestone}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Edit Project Form */}
      {isEditing && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Edit Project</h2>
            <form onSubmit={handleEditProject}>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <input
                  type="text"
                  value={editProjectData.projectName}
                  onChange={(e) => setEditProjectData(prev => ({ ...prev, projectName: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <input
                  type="number"
                  value={editProjectData.projectPriority}
                  onChange={(e) => setEditProjectData(prev => ({ ...prev, projectPriority: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <input
                  type="text"
                  value={editProjectData.type}
                  onChange={(e) => setEditProjectData(prev => ({ ...prev, type: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={editProjectData.notes}
                  onChange={(e) => setEditProjectData(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ml-3 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Form */}
      {isAddingMilestone && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Milestone</h2>
            <form onSubmit={handleSubmitMilestone}>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Milestone Name</label>
                <input
                  type="text"
                  value={newMilestoneData.milestoneName}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, milestoneName: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              {/* Add other milestone fields here */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingMilestone(false)}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ml-3 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrjList;
