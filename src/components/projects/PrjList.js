'use client'; // Ensure this component runs in the client
import React, { useState, useEffect } from 'react';
import MilestoneCard from './MilestoneCard';

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

  const sortedProjects = projects.sort((b, a) => b.projectPriority - a.projectPriority);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto md:px-0 md:h-auto">
      {sortedProjects.map((project) => {
        const sortedMilestones = sortMilestones(project.milestones);

        return (
          <div key={project._id} className="flex flex-col mb-1 max-w-[750px] mx-auto w-full h-full cursor-pointer" onClick={() => toggleOpen(project._id)}>
            <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px]"></div>

            <div className="flex justify-between items-center flex-col md:flex-row mb-3 md:mb-0">
              <h1 className="text-xl md:text-2xl font-semibold mb-2 pt-2 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700" >
                {project.projectName}
              </h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOpenEditForm(project)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:scale-95 text-xs hover:bg-yellow-700"
                >
                  Edit Project
                </button>
                <button
                  onClick={() => handleDeleteProject(project.projectName)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:scale-95 text-xs hover:bg-red-700"
                >
                  Delete Project
                </button>
                <button
                  onClick={() => handleAddMilestoneForm(project.projectName)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:scale-95 text-xs hover:bg-blue-700"
                >
                  Add Milestone
                </button>
                
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px] mb-3"></div>

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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:scale-95 text-xs"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg ml-2 hover:scale-95"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Form */}
      {isAddingMilestone && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-75">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Milestone</h2>
            <form onSubmit={handleSubmitMilestone}>
              <label className="block mb-2">
                Milestone Name:
                <input
                  type="text"
                  value={newMilestoneData.milestoneName}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, milestoneName: e.target.value }))}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                Priority:
                <input
                  type="number"
                  value={newMilestoneData.priority}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, priority: e.target.value }))}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                Start Date:
                <input
                  type="date"
                  value={newMilestoneData.startDate}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                Due Date:
                <input
                  type="date"
                  value={newMilestoneData.dueDate}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                Complete Date:
                <input
                  type="date"
                  value={newMilestoneData.completeDate}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, completeDate: e.target.value }))}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                Estimated Size:
                <input
                  type="text"
                  value={newMilestoneData.estimatedSize}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, estimatedSize: e.target.value }))}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                Actual Hours:
                <input
                  type="text"
                  value={newMilestoneData.actualHours}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, actualHours: e.target.value }))}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                Notes:
                <textarea
                  value={newMilestoneData.notes}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, notes: e.target.value }))}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                />
              </label>
              <label className="block mb-2">
                Target:
                <input
                  type="text"
                  value={newMilestoneData.target}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, target: e.target.value }))}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                />
              </label>
              <label className="block mb-4">
                Actual:
                <input
                  type="text"
                  value={newMilestoneData.actual}
                  onChange={(e) => setNewMilestoneData(prev => ({ ...prev, actual: e.target.value }))}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                />
              </label>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Add Milestone
              </button>
              <button
                type="button"
                onClick={() => setIsAddingMilestone(false)}
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
