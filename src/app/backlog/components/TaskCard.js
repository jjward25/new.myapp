"use client";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const TaskCard = ({ task, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableTask, setEditableTask] = useState({ ...task });
  const [isFlipped, setIsFlipped] = useState(false);

  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current) {
      // Reset height to auto to ensure dynamic resizing
      cardRef.current.style.height = 'auto';
      // Calculate the max height of front and back faces
      const frontHeight = cardRef.current.querySelector('.flip-card-front').scrollHeight;
      const backHeight = cardRef.current.querySelector('.flip-card-back').scrollHeight;
      const maxHeight = Math.max(frontHeight, backHeight);
      cardRef.current.style.height = `${maxHeight}px`;
    }
  }, [isFlipped, editableTask]);

  const handleInputChange = (e, key) => {
    setEditableTask({ ...editableTask, [key]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put('/api/backlog', { id: task._id, updatedItem: editableTask });
      onEdit(editableTask);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete('/api/backlog', { data: { id: task._id } });
      onDelete(task._id);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  return (
    <div
      ref={cardRef}
      className="flip-card relative w-full mx-auto my-2 md:m-3 p-1 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 rounded-lg cursor-pointer perspective-1000 overflow-hidden"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`flip-card-inner transition-transform duration-700 h-full p-1 relative ${isFlipped ? 'rotate-x-180' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face */}
        <div
          className={`flip-card-face flip-card-front bg-white p-4 rounded-lg shadow-lg absolute inset-0 ${isFlipped ? 'hidden' : 'block'}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className='flex flex-row justify-between items-center border-b mb-3'>
            <h2 className="font-bold text-xl flex-1">{isEditing ? 
              <input
                type="text"
                value={editableTask["Task Name"] || ''}
                onChange={(e) => handleInputChange(e, "Task Name")}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
              : editableTask["Task Name"]}</h2>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              &times;
            </button>
          </div>
          <div className='flex flex-col md:flex-row'>
            <div className='flex flex-col mr-5 pr-5 md:border-r'>
              <p className='mb-1 text-left'>
                <strong>Start Date:</strong> {isEditing ? 
                  <input
                    type="text"
                    value={editableTask["Start Date"] || ''}
                    onChange={(e) => handleInputChange(e, "Start Date")}
                    className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                  />
                  : editableTask["Start Date"]}
              </p>
              <p className='text-left'>
                <strong>Due Date:</strong> {isEditing ? 
                  <input
                    type="text"
                    value={editableTask["Due Date"] || ''}
                    onChange={(e) => handleInputChange(e, "Due Date")}
                    className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                  />
                  : editableTask["Due Date"]}
              </p>
            </div>
            <p className='text-left'>
              <strong>Notes:</strong> {isEditing ? 
                <textarea
                  value={editableTask["Notes"] || ''}
                  onChange={(e) => handleInputChange(e, "Notes")}
                  className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                />
                : editableTask["Notes"]}
            </p>
          </div>
          <div className='h-5'></div>
        </div>

        {/* Back Face */}
        <div
          className={`flip-card-face flip-card-back bg-gray-100 p-4 rounded-lg shadow-lg absolute inset-0 ${isFlipped ? 'block' : 'hidden'}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className='flex flex-row justify-between items-center mb-4'>
            <h2 className="font-bold text-xl flex-1">{editableTask["Task Name"]}</h2>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              &times;
            </button>
          </div>
          <div className="flex flex-col flex-1 overflow-auto">
            {Object.keys(editableTask).map((key, index) => (
              key !== "Task Name" && key !== "Start Date" && key !== "Due Date" && key !== "Priority" && key !== "Notes" && (
                <p className='text-left mb-2' key={index}>
                  <strong>{key}:</strong> {isEditing ? 
                    <input
                      type="text"
                      value={editableTask[key] || ''}
                      onChange={(e) => handleInputChange(e, key)}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                    : editableTask[key]}
                </p>
              )
            ))}
            {isEditing ? (
              <button
                onClick={handleSave}
                className="btn btn-primary mt-4 bg-cyan-700 hover:bg-cyan-800 text-neutral-100 w-full"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary mt-4 bg-neutral-400 hover:bg-neutral-500 text-cyan-700 w-full"
              >
                Edit
              </button>
            )}
          </div>
          <div className='h-5'></div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
