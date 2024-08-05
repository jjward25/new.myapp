// src/components/PrjCard.js
import React from 'react';

const PrjCard = ({ milestone }) => {
  // Destructure milestone properties, using bracket notation for keys with spaces
  const milestonePriority = milestone["Milestone Priority"];
  const startDate = milestone["Start Date"];
  const dueDate = milestone["Due Date"];
  const completeDate = milestone["Complete Date"];
  const estimatedSize = milestone["Estimated Size"];
  const actualHours = milestone["Actual Hours"];
  const notes = milestone["Notes"];
  const tasks = milestone["Tasks"] || {};

  console.log(tasks)
  // Extract task properties safely
  const taskName = tasks["Task Name"] || 'No Task Name';
  const taskPriority = tasks["Priority"] || 'No Priority';
  const taskDueDate = tasks["Due Date"] || 'No Due Date';
  const taskCompleteDate = tasks["Complete Date"] || 'No Complete Date';
  const taskNotes = tasks["Notes"] || 'No Notes';
  const taskEstimatedHours = tasks["Estimated Size"];
  const taskActualHours = tasks["Actual Hours"];


  return (
    <div className='w-[350px]'>

      <div className="prj-card p-1 bg-fuchsia-950 hover:bg-cyan-700 hover:scale-95 rounded-xl shadow-md mb-4 text-black">
        <div className='bg-slate-300 rounded-xl py-3 px-4'>
          <div className='flex flex-row mb-3 pb-2 border-b border-fuchsia-700'>
            <p className='max-w-[20px] text-left my-1 ml-0 mr-2 pl-2 pr-4 bg-cyan-900 rounded-lg font-semibold text-white text-sm border border-neutral-400 drop-shadow-md'>{milestonePriority}</p>
            <p className='font-semibold text-cyan-700 text-xl'>{milestone.milestoneName}</p>
          </div>
          <p className="text-sm">Start Date: {startDate || 'N/A'}</p>
          <p className="text-sm">Due Date: {dueDate || 'N/A'}</p>
          <p className="text-sm">Complete Date: {completeDate || 'N/A'}</p>
          <p className="text-sm">Estimated Size: {estimatedSize || 'N/A'}</p>
          <p className="text-sm">Actual Hours: {actualHours || 'N/A'}</p>
          <p className="text-sm">Notes: {notes || 'N/A'}</p>
        </div>
      </div>

      <div className="mx-auto mt-2 bg-gradient-to-tr hover:scale-95 from-cyan-500 via-slate-500 to-fuchsia-500 rounded-xl p-2">

        <div className='bg-slate-300 rounded-xl py-3 px-2'>
          
          <div className='flex flex-row'>
            <p className='max-w-[20px] text-left my-1 ml-0 mr-2 pl-2 pr-4 bg-gradient-to-r from-purple-500 via-red-500 to-pink-500 rounded-lg font-semibold text-white text-sm border border-neutral-400 drop-shadow-md'>{taskPriority}</p>
            <p className='font-semibold text-cyan-700 text-xl'>{taskName}</p>
          </div>

          <p className="text-sm text-black">Name: {taskName}</p>
          <p className="text-sm text-black">Priority: {taskPriority}</p>
          <p className="text-sm text-black">Estimated Hours: {taskEstimatedHours}</p>
          <p className="text-sm text-black">Actual Hours: {taskActualHours}</p>
          <p className="text-sm text-black">Due Date: {taskDueDate}</p>
          <p className="text-sm text-black">Complete Date: {taskCompleteDate}</p>
          <p className="text-sm text-black">Notes: {taskNotes}</p>
        </div>

      </div>

    </div>
  );
};

export default PrjCard;
