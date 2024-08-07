// src/components/MilestoneCard.js
import React from 'react';

const MilestoneCard = ({ milestone, handleDeleteMilestone }) => {
  const milestonePriority = milestone["Milestone Priority"];
  const startDate = milestone["Start Date"];
  const dueDate = milestone["Due Date"];
  const completeDate = milestone["Complete Date"];
  const estimatedSize = milestone["Estimated Size"];
  const actualHours = milestone["Actual Hours"];
  const notes = milestone["Notes"];

  return (
    <div className='w-[350px]'>
      <div className="prj-card p-1 bg-fuchsia-950 hover:bg-cyan-700 hover:scale-95 rounded-xl shadow-md mb-4 text-black">
        <div className='bg-slate-300 rounded-xl py-3 px-4'>
          <div className='flex flex-row mb-3 pb-2 border-b border-fuchsia-700'>
            <p className='max-w-[20px] text-left my-1 ml-0 mr-2 pl-2 pr-4 bg-cyan-900 rounded-lg font-semibold text-white text-sm border border-neutral-400 drop-shadow-md'>
              {milestonePriority}
            </p>
            <p className='font-semibold text-cyan-700 text-xl'>
              {milestone.milestoneName}
            </p>
          </div>
          <p className="text-sm">Start Date: {startDate || 'N/A'}</p>
          <p className="text-sm">Due Date: {dueDate || 'N/A'}</p>
          <p className="text-sm">Complete Date: {completeDate || 'N/A'}</p>
          <p className="text-sm">Estimated Size: {estimatedSize || 'N/A'}</p>
          <p className="text-sm">Actual Hours: {actualHours || 'N/A'}</p>
          <p className="text-sm">Notes: {notes || 'N/A'}</p>
          <button
            onClick={() => handleDeleteMilestone(milestone)}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default MilestoneCard;
