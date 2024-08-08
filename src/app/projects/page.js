"use client";
import React, { useState, useEffect } from 'react';
import PrjList from '../../components/projects/PrjList';
import { getCurrentFormattedDate } from '../../utils/Date';
import MilestoneTrendComponent from '../../components/d3/MilestoneTrendComponent';

const Milestones = () => {
  const today = getCurrentFormattedDate();
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ projectName: '', projectPriority: '', projectType: '', projectNotes: '' });
  const [showCompletedMilestones, setShowCompletedMilestones] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editMilestoneDetails, setEditMilestoneDetails] = useState({
    MilestonePriority: '',
    StartDate: '',
    DueDate: '',
    CompleteDate: '',
    EstimatedSize: '',
    ActualHours: '',
    Notes: '',
    Target: '',
    Actual: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditMilestoneDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: newProject.projectName,
          projectPriority: newProject.projectPriority,
          projectType: newProject.projectType || null,
          projectNotes: newProject.projectNotes || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setNewProject({ projectName: '', projectPriority: '', projectType: '', projectNotes: '' });
      setShowForm(false);
      fetchProjects(); // Fetch projects to update the list
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMilestone) return;
    try {
      const response = await fetch('/api/projects/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: editingMilestone.projectId,
          milestoneName: editingMilestone.milestoneName,
          updates: editMilestoneDetails,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setEditingMilestone(null);
      setEditMilestoneDetails({
        MilestonePriority: '',
        StartDate: '',
        DueDate: '',
        CompleteDate: '',
        EstimatedSize: '',
        ActualHours: '',
        Notes: '',
        Target: '',
        Actual: ''
      });
      fetchProjects(); // Fetch projects to update the list
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const handleDelete = async (projectId, milestoneName) => {
    try {
      const response = await fetch('/api/projects/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          milestoneName,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      fetchProjects(); // Fetch projects to update the list
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setProjects(data.map((project) => ({
        _id: project._id,
        projectName: project["Project Name"],
        projectPriority: project["Project Priority"],
        type: project["Type"],
        notes: project["Notes"],
        milestones: Object.entries(project.Milestones).map(([milestoneName, milestone]) => ({
          ...milestone,
          milestoneName,
        })),
      })));
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredMilestones = projects.flatMap(project =>
    project.milestones.filter(milestone =>
      showCompletedMilestones
        ? milestone["Complete Date"] && milestone["Complete Date"] !== ""
        : false
    )
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full justify-center">
      <h1 className="text-5xl font-semibold bg-clip-text text-transparent bg-cyan-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-0 mb-10 md:mb-10 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat shadow-2xl transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms] text-center">
        Project Milestones
      </h1>
      <p className='text-white py-4 mb-12 w-full max-w-[750px] text-center'>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:scale-95 hover:bg-green-700"
        >
          {showForm ? 'Cancel' : 'Add New Project'}
        </button>
        {showForm && (
          <form onSubmit={handleSubmit} className="my-4">
            <div className="flex flex-col max-w-[500px] mx-auto">
              <input
                type="text"
                name="projectName"
                value={newProject.projectName}
                onChange={handleInputChange}
                placeholder="Project Name"
                className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                required
              />
              <input
                type="text"
                name="projectPriority"
                value={newProject.projectPriority}
                onChange={handleInputChange}
                placeholder="Project Priority"
                className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                required
              />
              <input
                type="text"
                name="projectType"
                value={newProject.projectType}
                onChange={handleInputChange}
                placeholder="Project Type"
                className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
              />
              <input
                type="text"
                name="projectNotes"
                value={newProject.projectNotes}
                onChange={handleInputChange}
                placeholder="Project Notes"
                className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:scale-95"
              >
                Add Project
              </button>
            </div>
          </form>
        )}
      </p>

      <div className='w-full bg-gradient-to-tr from-black to-slate-800 rounded-xl mb-8 border border-white max-w-[750px]'>
        <MilestoneTrendComponent/>
      </div>

      <div className="flex flex-col w-full h-full mb-10">
        <div className="flex flex-col w-full h-full m-auto">
          <PrjList /> {/* This will still show the project list */}
        </div>
      </div>

      <div className="flex flex-col w-full h-full mb-10">
        <button
          onClick={() => setShowCompletedMilestones((prev) => !prev)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:scale-95 hover:bg-purple-700 max-w-[750px] mx-auto"
        >
          {showCompletedMilestones ? 'Hide Completed Milestones' : 'Show Completed Milestones'}
        </button>
        {showCompletedMilestones && (
          <div className="mt-4 max-w-[750px] w-full mx-auto">
            {filteredMilestones.length > 0 ? (
              <ul>
                {filteredMilestones.map((milestone, index) => (
                  <li key={index} className="p-2 mt-10 border border-gray-300 rounded-lg mb-2 bg-gradient-to-tr from-cyan-900 to-fuchsia-900">
                    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md mb-4">
                      <div className="flex items-center mb-2">
                        <span className="font-bold">Milestone Name:</span>
                        <span className="ml-2">{milestone.milestoneName}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-bold">Milestone Priority:</span>
                        <span className="ml-2">{milestone["Milestone Priority"]}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-bold">Start Date:</span>
                        <span className="ml-2">{milestone["Start Date"]}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-bold">Complete Date:</span>
                        <span className="ml-2">{milestone["Complete Date"]}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-bold">Due Date:</span>
                        <span className="ml-2">{milestone["Due Date"]}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-bold">Estimated Size:</span>
                        <span className="ml-2">{milestone["Estimated Size"]}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-bold">Actual Hours:</span>
                        <span className="ml-2">{milestone["Actual Hours"]}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-bold">Notes:</span>
                        <span className="ml-2">{milestone["Notes"]}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-bold">Target:</span>
                        <span className="ml-2">{milestone["Target"]}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-bold">Actual:</span>
                        <span className="ml-2">{milestone["Actual"]}</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setEditingMilestone({
                            projectId: milestone.projectId,
                            milestoneName: milestone.milestoneName,
                          });
                          setEditMilestoneDetails(milestone);
                        }}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:scale-95"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(milestone.projectId, milestone.milestoneName)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:scale-95 ml-2"
                      >
                        Delete
                      </button>
                    </div>
                    {editingMilestone && editingMilestone.milestoneName === milestone.milestoneName && (
                      <form onSubmit={handleEditSubmit} className="mt-4">
                        <input
                          type="text"
                          name="MilestonePriority"
                          value={editMilestoneDetails.MilestonePriority}
                          onChange={handleEditChange}
                          className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                          placeholder="Milestone Priority"
                        />
                        <input
                          type="text"
                          name="StartDate"
                          value={editMilestoneDetails.StartDate}
                          onChange={handleEditChange}
                          className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                          placeholder="Start Date"
                        />
                        <input
                          type="text"
                          name="DueDate"
                          value={editMilestoneDetails.DueDate}
                          onChange={handleEditChange}
                          className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                          placeholder="Due Date"
                        />
                        <input
                          type="text"
                          name="CompleteDate"
                          value={editMilestoneDetails.CompleteDate}
                          onChange={handleEditChange}
                          className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                          placeholder="Complete Date"
                        />
                        <input
                          type="text"
                          name="EstimatedSize"
                          value={editMilestoneDetails.EstimatedSize}
                          onChange={handleEditChange}
                          className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                          placeholder="Estimated Size"
                        />
                        <input
                          type="text"
                          name="ActualHours"
                          value={editMilestoneDetails.ActualHours}
                          onChange={handleEditChange}
                          className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                          placeholder="Actual Hours"
                        />
                        <input
                          type="text"
                          name="Notes"
                          value={editMilestoneDetails.Notes}
                          onChange={handleEditChange}
                          className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                          placeholder="Notes"
                        />
                        <input
                          type="text"
                          name="Target"
                          value={editMilestoneDetails.Target}
                          onChange={handleEditChange}
                          className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                          placeholder="Target"
                        />
                        <input
                          type="text"
                          name="Actual"
                          value={editMilestoneDetails.Actual}
                          onChange={handleEditChange}
                          className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
                          placeholder="Actual"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:scale-95"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMilestone(null)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:scale-95 ml-2"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No completed milestones found.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Milestones;
