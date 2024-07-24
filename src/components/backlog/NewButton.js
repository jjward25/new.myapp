// src/components/Backlog/AddNewTaskForm.js
"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { getCurrentFormattedDate } from '../../components/date';

const AddNewTaskForm = () => {
  const [formData, setFormData] = useState({
    "Task Name": '',
    "Start Date": '',
    "Due Date": '',
    "Priority": '',
    "Type": '',
    "Project": '',
    "Notes": '',
    "Links": '',
    "Complete Date": ''
  });

  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/backlog', formData);
      alert('Task added successfully');
      setFormData({
        "Task Name": '',
        "Start Date": '',
        "Due Date": '',
        "Priority": '',
        "Type": '',
        "Project": '',
        "Notes": '',
        "Links": '',
        "Complete Date": ''
      });
      setIsFormVisible(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  return (
    <div className="flex flex-col w-full mb-4">
      {/* Button to show the form */}
      <button
        onClick={() => setIsFormVisible(!isFormVisible)}
        className="btn mx-auto border-cyan-700 hover:border-cyan-500 btn-secondary bg-gradient-to-br from-black via-slate-800 to-neutral-800 hover:bg-black text-cyan-700 w-full max-w-[1000px]"
      >
        {isFormVisible ? 'Hide Form' : 'Add New Task'}
      </button>

      {/* Form to add a new task */}
      {isFormVisible && (
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-[1000px] mx-auto my-5 bg-slate-800 rounded-lg p-4">
          <div>
            <label htmlFor="task-name" className="block mb-2 text-cyan-500">
              Task Name:
              <input
                id="task-name"
                name="Task Name"
                type="text"
                value={formData["Task Name"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
          <div>
            <label htmlFor="start-date" className="block mb-2 text-cyan-500">
              Start Date:
              <input
                id="start-date"
                name="Start Date"
                type="text"
                value={formData["Start Date"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
          <div>
            <label htmlFor="due-date" className="block mb-2 text-cyan-500">
              Due Date:
              <input
                id="due-date"
                name="Due Date"
                type="text"
                value={formData["Due Date"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
          <div>
            <label htmlFor="priority" className="block mb-2 text-cyan-500">
              Priority:
              <input
                id="priority"
                name="Priority"
                type="text"
                value={formData["Priority"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
          <div>
            <label htmlFor="type" className="block mb-2 text-neutral-400">
              Type:
              <input
                id="type"
                name="Type"
                type="text"
                value={formData["Type"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
          <div>
            <label htmlFor="project" className="block mb-2 text-neutral-400">
              Project:
              <input
                id="project"
                name="Project"
                type="text"
                value={formData["Project"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
          <div>
            <label htmlFor="notes" className="block mb-2 text-cyan-500">
              Notes:
              <textarea
                id="notes"
                name="Notes"
                value={formData["Notes"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
          <div>
            <label htmlFor="links" className="block mb-2 text-neutral-400">
              Links:
              <input
                id="links"
                name="Links"
                type="text"
                value={formData["Links"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
          <div>
            <label htmlFor="complete-date" className="block mb-2 text-neutral-400">
              Complete Date:
              <input
                id="complete-date"
                name="Complete Date"
                type="text"
                value={formData["Complete Date"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
          <button
            type="submit"
            className="btn btn-primary bg-cyan-700 hover:bg-cyan-800 text-neutral-100 w-full"
          >
            Add Task
          </button>
        </form>
      )}
    </div>
  );
};

export default AddNewTaskForm;
