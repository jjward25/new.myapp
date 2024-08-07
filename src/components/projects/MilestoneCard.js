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
    <div className='w-[350px]'>
      <div className="prj-card p-1 bg-fuchsia-950 hover:bg-cyan-700 hover:scale-95 rounded-xl shadow-md mb-4 text-black">
        <div className='bg-slate-300 rounded-xl py-3 px-4'>
          <div className='flex flex-row mb-3 pb-2 border-b border-fuchsia-700'>
            <p className='max-w-[20px] text-left my-1 ml-0 mr-2 pl-2 pr-4 bg-cyan-900 rounded-lg font-semibold text-white text-sm border border-neutral-400 drop-shadow-md'>
              {milestone["Milestone Priority"]}
            </p>
            <p className='font-semibold text-cyan-700 text-xl'>
              {milestone.milestoneName}
            </p>
          </div>
          {isEditing ? (
            <div>
              <label className="text-sm">Start Date:</label>
              <input
                type="text"
                name="Start Date"
                value={editedMilestone["Start Date"] || ''}
                onChange={handleInputChange}
                className="text-sm"
              />
              <label className="text-sm">Due Date:</label>
              <input
                type="text"
                name="Due Date"
                value={editedMilestone["Due Date"] || ''}
                onChange={handleInputChange}
                className="text-sm"
              />
              <label className="text-sm">Complete Date:</label>
              <input
                type="text"
                name="Complete Date"
                value={editedMilestone["Complete Date"] || ''}
                onChange={handleInputChange}
                className="text-sm"
              />
              <label className="text-sm">Estimated Size:</label>
              <input
                type="text"
                name="Estimated Size"
                value={editedMilestone["Estimated Size"] || ''}
                onChange={handleInputChange}
                className="text-sm"
              />
              <label className="text-sm">Actual Hours:</label>
              <input
                type="text"
                name="Actual Hours"
                value={editedMilestone["Actual Hours"] || ''}
                onChange={handleInputChange}
                className="text-sm"
              />
              <label className="text-sm">Notes:</label>
              <input
                type="text"
                name="Notes"
                value={editedMilestone.Notes || ''}
                onChange={handleInputChange}
                className="text-sm"
              />
              <button
                onClick={handleSave}
                className="mt-2 px-3 py-1 bg-green-500 text-white rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="mt-2 ml-2 px-3 py-1 bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm">Start Date: {milestone["Start Date"] || 'N/A'}</p>
              <p className="text-sm">Due Date: {milestone["Due Date"] || 'N/A'}</p>
              <p className="text-sm">Complete Date: {milestone["Complete Date"] || 'N/A'}</p>
              <p className="text-sm">Estimated Size: {milestone["Estimated Size"] || 'N/A'}</p>
              <p className="text-sm">Actual Hours: {milestone["Actual Hours"] || 'N/A'}</p>
              <p className="text-sm">Notes: {milestone.Notes || 'N/A'}</p>
              <button
                onClick={() => handleDeleteMilestone(milestone)}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg"
              >
                Delete
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 ml-2 px-3 py-1 bg-blue-500 text-white rounded-lg"
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
