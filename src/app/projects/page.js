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
        completeDate: project["Project Complete Date"] ? new Date(project["Project Complete Date"]) : null, // Only set if the date exists, otherwise set to null
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
    ).map(milestone => ({
      ...milestone,
      projectName: project.projectName,
      completeDate: project.completeDate
    }))
  );

  const completedMilestones = projects.flatMap(project => 
    project.milestones.filter(milestone =>
      milestone["Complete Date"] && milestone["Complete Date"] !== ""
    ).map(milestone => ({
      ...milestone,
      projectName: project.projectName, // Adding the project name to the milestone object
      completeDate: project.completeDate
    }))
  );
  
  // Group milestones by project and sort them
  const groupedMilestones = completedMilestones.reduce((acc, milestone) => {
    const projectName = milestone.projectName;
    const completeDate = milestone.completeDate
    if (!acc[projectName]) {
      acc[projectName] = {
        milestones: [],
        completeDate: completeDate, 
      };
    }
    acc[projectName].milestones.push(milestone);
    return acc;
  }, {});
  
  const sortedProjects = Object.entries(groupedMilestones)
    .map(([projectName, { milestones, completeDate }]) => ({
      projectName,
      milestones: milestones.sort((a, b) => new Date(b["Complete Date"]) - new Date(a["Complete Date"])),
      lastCompletedDate: milestones[0] ? new Date(milestones[0]["Complete Date"]) : new Date(0),
      completeDate, 
      isComplete: completeDate !== null,
    }))
    .sort((a, b) => b.lastCompletedDate - a.lastCompletedDate);
  

  console.log('Fetched Projects:', sortedProjects);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full justify-center">
      <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-cyan-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-0 mb-10 md:mb-10 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat  transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms] text-center">
        Project Milestones
      </h1>
      <p className='text-white py-4 mb-12 w-full max-w-[750px] text-center'>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:scale-95 hover:bg-cyan-700"
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

      <div className='w-full bg-gradient-to-tr from-black to-slate-800 rounded-xl mb-8 borader border-white max-w-[750px]'>
        <div className='w-full'>
          <MilestoneTrendComponent/>
        </div>
      </div>

      <div className="flex flex-col w-full h-full mb-10">
        <div className="flex flex-col w-full h-full m-auto">
          <PrjList /> {/* This will still show the project list */}
        </div>
      </div>

      <div className="flex flex-col w-full h-full mb-10">
        <button
          onClick={() => setShowCompletedMilestones((prev) => !prev)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:scale-95 hover:bg-cyan-700 max-w-[750px] mx-auto"
        >
          {showCompletedMilestones ? 'Hide Completed Milestones' : 'Show Completed Milestones'}
        </button>
        {showCompletedMilestones && (
          <div className="w-full max-w-[750px] mt-12 mx-auto">
            {sortedProjects.map((project, index) => (
              <div key={index} className="mb-4 border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className='flex flex-row justify-between mb-1'>
                  <h2 className="text-xl font-semibold">{project.projectName}</h2>
                  <h2 className={`text-sm font-semibold ${project.completeDate ? 'text-green-700' : 'text-yellow-500'}`}>
                    {project.completeDate ? 'Complete' : 'Open'}
                  </h2>
                </div>
                <ul className="list-disc pl-5">
                  {project.milestones.map((milestone, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      <strong>{milestone.milestoneName}</strong> - Completed on: {milestone["Complete Date"]}
                      <button
                        onClick={() => {
                          setEditingMilestone({
                            projectId: project._id,
                            milestoneName: milestone.milestoneName,
                          });
                          setEditMilestoneDetails({
                            MilestonePriority: milestone["Milestone Priority"],
                            StartDate: milestone["Start Date"],
                            DueDate: milestone["Due Date"],
                            CompleteDate: milestone["Complete Date"],
                            EstimatedSize: milestone["Estimated Size"],
                            ActualHours: milestone["Actual Hours"],
                            Notes: milestone["Notes"],
                            Target: milestone["Target"],
                            Actual: milestone["Actual"],
                          });
                        }}
                        className="ml-2 text-blue-700 hover:text-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project._id, milestone.milestoneName)}
                        className="ml-2 text-red-700 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
};

export default Milestones;
