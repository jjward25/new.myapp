// src/components/tasks/NewTaskButton.js
"use client";
import React, { useState } from 'react';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};

// Function to get today's date in EST
const getTodayInEST = () => {
  const today = new Date();
  // Convert to EST and format to YYYY-MM-DD
  const options = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' };
  const estDate = today.toLocaleString('en-CA', options); // 'en-CA' gives the YYYY-MM-DD format directly
  return estDate; // Returns the date in YYYY-MM-DD format
};

const today = getTodayInEST();

const AddNewTaskForm = ({ onTaskAdded }) => {
  const [formData, setFormData] = useState({
    "Task Name": '',
    "Start Date": '',
    "Due Date": today,
    "Priority": 'P1',
    "Type": 'Task',
    "Project": '',
    "Notes": '',
    "Links": '',
    "Complete Date": '',
    "Session": 'Small'
  });

  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedData = {
      ...formData,
      "Start Date": formatDate(formData["Start Date"]),
      "Due Date": formatDate(formData["Due Date"]),
      "Complete Date": formatDate(formData["Complete Date"])
    };

    try {
      const response = await fetch('/api/backlog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        alert('Task added successfully');
        setFormData({
          "Task Name": '',
          "Start Date": '',
          "Due Date": '',
          "Priority": 'P2',
          "Type": 'Task',
          "Project": '',
          "Notes": '',
          "Links": '',
          "Complete Date": '',
          "Session":'Small'
        });
        setIsFormVisible(false);
        if (onTaskAdded) onTaskAdded(); // Trigger refresh in the parent component
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[1000px] ">
      <button
        onClick={() => setIsFormVisible(!isFormVisible)}
        className={`btn text-sm mx-0 border-cyan-950 bg-cyan-950 hover:border-cyan-200 text-white btn-secondary hover:bg-cyan-950 hover:text-cyan-300 w-auto max-w-[1000px] min-h-0 h-10`}
      >
        {isFormVisible ? 'Hide Form' : 'Add New Task'}
      </button>

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="space-y-4 w-full mx-auto my-5 bg-slate-800 rounded-lg p-4">
          {/* Form Fields */}
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
                required
              />
            </label>
          </div>
          
          <div>
            <label htmlFor="due-date" className="block mb-2 text-cyan-500">
              Due Date:
              <input
                id="due-date"
                name="Due Date"
                type="date"
                value={formData["Due Date"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                required
              />
            </label>
          </div>
          <div>
            <label htmlFor="priority" className="block mb-2 text-cyan-500">
              Priority:
              <select
                id="priority"
                name="Priority"
                value={formData["Priority"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              >
                <option value="">Select Priority</option>
                <option value="P0">P0 - Top Priority</option>
                <option value="P1">P1 - Action Items</option>
                <option value="P2">P2 - Next Up</option>
                <option value="P3">P3 - Time Permitting</option>
              </select>
            </label>
          </div>
          <div>
            <label htmlFor="session" className="block mb-2 text-cyan-500">
              Session:
              <select
                id="session"
                name="Session"
                value={formData["Session"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              >
                <option value="">Select Session</option>
                <option value="Next">Next</option>
                <option value="Big">Big</option>
                <option value="Small">Small</option>
              </select>
            </label>
          </div>
          <div>
            <label htmlFor="type" className="block mb-2 text-cyan-500">
              Type:
              <select
                id="type"
                name="Type"
                value={formData["Type"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              >
                <option value="">Select type</option>
                <option value="Event">Event</option>
                <option value="Task">Task</option>
                <option value="List">List</option>
              </select>
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
                className="textarea textarea-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
      
          <div>
            <label htmlFor="complete-date" className="block mb-2 text-cyan-500">
              Complete Date:
              <input
                id="complete-date"
                name="Complete Date"
                type="date"
                value={formData["Complete Date"]}
                onChange={handleInputChange}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            </label>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full max-w-[1000px] text-neutral-100"
          >
            Add Task
          </button>
        </form>
      )}
    </div>
  );
};

export default AddNewTaskForm;
