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
      milestoneName: milestone.milestoneName // Pass original milestone name
    });
    setIsEditing(false);
  };

  return (
    <div className='w-full mt-2'>
      <div className="prj-card p-[2px] bg-cyan-900 hover:bg-fuchsia-600 rounded-lg shadow-md mb-4 text-black cursor-pointer">
        <div className='bg-slate-300 rounded-lg py-1 px-1'>
          <div className='flex flex-row mb-1 pt-0'>
            <p className='max-w-[30px] m-1 p-1 mr-3 text-center bg-cyan-900 rounded-xl font-semibold text-white text-xs border border-neutral-400 drop-shadow-md'>
              P{milestone["Milestone Priority"]}
            </p>
            <p className='font-semibold text-cyan-700 text-md my-auto pr-4'>
              {milestone.milestoneName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneCard;
