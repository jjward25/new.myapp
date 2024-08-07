// src/components.projects/MilestoneCard.js

import React, { useState } from 'react';

const MilestoneCard = ({ milestone, handleDeleteMilestone, handleEditMilestone }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMilestone, setEditedMilestone] = useState(milestone);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedMilestone((prevMilestone) => ({
      ...prevMilestone,
      [name]: value || null, // Convert empty string to null
    }));
  };

  const handleSave = () => {
    // Ensure `editedMilestone` contains all required fields
    handleEditMilestone({
      ...editedMilestone,
      milestoneName: milestone.milestoneName // Pass original milestone name
    });
    setIsEditing(false);
  };

  return (
    <div className='w-[280px] mt-2'>
      <div className="prj-card p-1 bg-cyan-700 hover:bg-fuchsia-950 hover:scale-95 rounded-xl shadow-md mb-4 text-black">
        <div className='bg-slate-300 rounded-xl py-2 px-3'>
          <div className='flex flex-row mb-1 pb-2 pt-0 border-b-2 border-cyan-900'>
            <p className='max-w-[30px] m-1 p-1 mr-3 text-center bg-cyan-900 rounded-xl font-semibold text-white text-xs border border-neutral-400 drop-shadow-md'>
              P{milestone["Milestone Priority"]}
            </p>
            <p className='font-semibold text-cyan-700 text-md my-auto'>
              {milestone.milestoneName}
            </p>
          </div>
          {isEditing ? (
            <div>
              <div className="mb-2">
                <label className="text-xs pl-2 block mb-1">Start Date:</label>
                <input
                  type="text"
                  name="Start Date"
                  value={editedMilestone["Start Date"] || ''}
                  onChange={handleInputChange}
                  className="text-xs pl-2 w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="text-xs pl-2 block mb-1">Due Date:</label>
                <input
                  type="text"
                  name="Due Date"
                  value={editedMilestone["Due Date"] || ''}
                  onChange={handleInputChange}
                  className="text-xs pl-2 w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="text-xs pl-2 block mb-1">Complete Date:</label>
                <input
                  type="text"
                  name="Complete Date"
                  value={editedMilestone["Complete Date"] || ''}
                  onChange={handleInputChange}
                  className="text-xs pl-2 w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="text-xs pl-2 block mb-1">Estimated Size:</label>
                <input
                  type="text"
                  name="Estimated Size"
                  value={editedMilestone["Estimated Size"] || ''}
                  onChange={handleInputChange}
                  className="text-xs pl-2 w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="text-xs pl-2 block mb-1">Actual Hours:</label>
                <input
                  type="text"
                  name="Actual Hours"
                  value={editedMilestone["Actual Hours"] || ''}
                  onChange={handleInputChange}
                  className="text-xs pl-2 w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="text-xs pl-2 block mb-1">Actual:</label>
                <input
                  type="text"
                  name="Actual"
                  value={editedMilestone["Actual"] || ''}
                  onChange={handleInputChange}
                  className="text-xs pl-2 w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="text-xs pl-2 block mb-1">Target:</label>
                <input
                  type="text"
                  name="Target"
                  value={editedMilestone["Target"] || ''}
                  onChange={handleInputChange}
                  className="text-xs pl-2 w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="text-xs pl-2 block mb-1">Priority:</label>
                <input
                  type="text"
                  name="Milestone Priority"
                  value={editedMilestone["Milestone Priority"] || ''}
                  onChange={handleInputChange}
                  className="text-xs pl-2 w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="text-xs pl-2 block mb-1">Notes:</label>
                <input
                  type="text"
                  name="Notes"
                  value={editedMilestone.Notes || ''}
                  onChange={handleInputChange}
                  className="text-xs pl-2 w-full p-1 border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={handleSave}
                className="mt-2 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-700 hover:scale-95"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="mt-2 ml-2 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-700 hover:scale-95"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className='mb-2'>

              <div className='flex flex-row px-2'>
                <div className="border-r border-fuchsia-700 w-3/5">
                  <span className="font-semibold text-xs">Estimated Size: </span>
                  <span className='font-normal text-xs'>{milestone["Estimated Size"] || 'N/A'}</span>
                </div>
                <div className="">
                  <span className="font-semibold text-xs w-2/5 ml-3 text-start">Target: </span>
                  <span className='font-normal text-xs'>{milestone["Target"] || 'N/A'}</span>
                </div>
                
              </div>

              <div className='flex flex-row px-2 pb-2 mb-2 border-b border-fuchsia-700'>
                <div className=" border-r border-fuchsia-700 w-3/5">
                  <span className="font-semibold text-xs">Actual Hours: </span>
                  <span className='font-normal text-xs'>{milestone["Actual Hours"] || 'N/A'}</span>
                </div>
                <div className="">
                  <span className="font-semibold text-xs ml-3 text-start">Actual: </span>
                  <span className='font-normal text-xs'>{milestone["Actual"] || 'N/A'}</span>
                </div>
              </div>

              <div className="">
                <span className="font-semibold text-xs pl-2">Start Date: </span>
                <span className='font-normal text-xs'>{milestone["Start Date"] || 'N/A'}</span>
              </div>
              <div className="">
                <span className="font-semibold text-xs pl-2">Due Date: </span>
                <span className='font-normal text-xs'>{milestone["Due Date"] || 'N/A'}</span>
              </div>
              <div className="">
                <span className="font-semibold text-xs pl-2">Complete Date: </span>
                <span className='font-normal text-xs'>{milestone["Complete Date"] || 'N/A'}</span>
              </div>

              <div className="">
                <span className="font-semibold text-xs pl-2">Priority: </span>
                <span className='font-normal text-xs'>{milestone["Milestone Priority"] || 'N/A'}</span>
              </div>

              <div className="mb-1 border-t border-b border-fuchsia-700 pt-2 mt-2 pb-2">
                <span className="font-semibold text-xs pl-2">Notes: </span>
                <span className='font-normal text-xs'>{milestone.Notes || 'N/A'}</span>
              </div>
              <button
                onClick={() => handleDeleteMilestone(milestone)}
                className="text-xs mt-3 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs mt-2 ml-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilestoneCard;
