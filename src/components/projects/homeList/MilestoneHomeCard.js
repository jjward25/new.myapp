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
      milestoneNotes: milestone.Notes,
      projectNAme: milestone.ProjectName,
      milestonePriority: milestone["Milestone Priority"]
    });
    setIsEditing(false);
  };

  return (
    <div className='w-full'>
      <div className="prj-card p-[2px] rounded-r-lg text-black">
        <div className='rounded-r-lg'>
          <div className='flex-col bg-cyan-900 px-2 py-1 rounded-r-lg'>
            <p className='font-semibold text-neutral-300 text-sm my-auto pr-4'>
              {milestone.milestoneName}
            </p>
            {milestone.Notes && (
              <p className='text-xs text-cyan-600'>
                {milestone.Notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneCard;
