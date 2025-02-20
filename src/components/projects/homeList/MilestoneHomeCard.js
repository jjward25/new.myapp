// src/components/projects/MilestoneCard.js

import React, { useState, useEffect } from 'react';

const MilestoneCard = ({ milestone }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMilestone, setEditedMilestone] = useState(milestone);

  // Effect to reset editedMilestone whenever milestone prop changes
  useEffect(() => {
    setEditedMilestone(milestone);
  }, [milestone]);

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
      milestoneName: milestone.milestoneName, // Pass original milestone name
      milestoneNotes: milestone.Notes
    });
    setIsEditing(false);
  };

  return (
    <div className='w-full'>
      <div className="prj-card p-[2px] rounded-lg text-black">
        <div className='rounded-lg pt-1 px-1'>
          <div className='flex flex-row mb-1 pt-0'>
            <p className='max-w-[30px] m-1 p-1 mr-3 mt-0 mb-auto text-center bg-cyan-900 rounded-xl font-semibold text-white text-xs border border-neutral-400 drop-shadow-md'>
              P{milestone["Milestone Priority"]}
            </p>
            <div className='flex-col'>
              <p className='font-semibold text-cyan-700 text-md my-auto pr-4'>
                {milestone.milestoneName}
              </p>
              <p className='text-xs text-gray-500'>
                {milestone.Notes}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneCard;
