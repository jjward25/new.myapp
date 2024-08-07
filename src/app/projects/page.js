// src/app/projects/page.js
"use client"
import React, { useState } from 'react';
import PrjList from '../../components/projects/PrjList';
import { getCurrentFormattedDate } from '../../utils/Date';

const Milestones = () => {
  const today = getCurrentFormattedDate();
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ projectName: '', projectPriority: '', projectType:'', projectNotes:'' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
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

      // Optionally, refetch projects or update the state if needed
      // For now, you can just reset the form
      setNewProject({ projectName: '', projectPriority: '',projectType:'',projectNotes:'' });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">
      <h1 className="text-5xl font-semibold bg-clip-text text-transparent bg-cyan-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-0 mb-10 md:mb-14 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat shadow-2xl transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms] text-center">
        Project Milestones
      </h1>
      <p className='text-white py-4 mb-14 border-t border-b border-cyan-700 w-full max-w-[750px] text-center'>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          {showForm ? 'Cancel' : 'Add New Project'}
        </button>
        {showForm && (
        <form onSubmit={handleSubmit} className="mb-4">
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
              value={newProject.newProject}
              onChange={handleInputChange}
              placeholder="Project Notes"
              className="mb-2 px-4 py-2 border border-gray-300 rounded-lg text-cyan-700"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Add Project
            </button>
          </div>
        </form>
      )}
      </p>

      <div className="flex flex-col w-full h-full mb-10">
        <div className="flex flex-col w-full h-full m-auto">
          <PrjList />
        </div>
      </div>
    </main>
  );
};

export default Milestones;
