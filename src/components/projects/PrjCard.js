// src/components/PrjCard.js
import React from 'react';

const PrjCard = ({ milestone }) => {
  // Destructure milestone properties, using bracket notation for keys with spaces
  const milestoneName = milestone["Project Name"];
  const milestonePriority = milestone["Milestones Priority"];
  const startDate = milestone["Start Date"];
  const dueDate = milestone["Due Date"];
  const completeDate = milestone["Complete Date"];
  const notes = milestone["Notes"];
  const tasks = milestone["Tasks"] || {};

  // Extract task properties safely
  const taskName = tasks["Task Name"] || 'No Task Name';
  const taskPriority = tasks["Priority"] || 'No Priority';
  const taskStartDate = tasks["Start Date"] || 'No Start Date';
  const taskDueDate = tasks["Due Date"] || 'No Due Date';
  const taskCompleteDate = tasks["Complete Date"] || 'No Complete Date';
  const taskNotes = tasks["Notes"] || 'No Notes';

  return (
    <div>
      <div className="prj-card p-4 bg-gray-100 rounded-lg shadow-md mb-4">
        <h3 className="text-lg font-semibold text-cyan-400 mb-2">{milestoneName}</h3>
        <p className="text-sm text-gray-700">Priority: {milestonePriority}</p>
        <p className="text-sm text-gray-700">Start Date: {startDate || 'N/A'}</p>
        <p className="text-sm text-gray-700">Due Date: {dueDate || 'N/A'}</p>
        <p className="text-sm text-gray-700">Complete Date: {completeDate || 'N/A'}</p>
        <p className="text-sm text-gray-700">Notes: {notes || 'N/A'}</p>
      </div>
      <div className="mt-2">
        <h4 className="text-md font-semibold">Tasks:</h4>
        <p className="text-sm text-gray-700">Task Name: {taskName}</p>
        <p className="text-sm text-gray-700">Priority: {taskPriority}</p>
        <p className="text-sm text-gray-700">Start Date: {taskStartDate}</p>
        <p className="text-sm text-gray-700">Due Date: {taskDueDate}</p>
        <p className="text-sm text-gray-700">Complete Date: {taskCompleteDate}</p>
        <p className="text-sm text-gray-700">Notes: {taskNotes}</p>
      </div>
    </div>
  );
};

export default PrjCard;
