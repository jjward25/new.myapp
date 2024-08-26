//src/components/TaskCard.js
"use client";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const TaskCard = ({ task, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableTask, setEditableTask] = useState({ ...task });
  const [isFlipped, setIsFlipped] = useState(false);

  const cardRef = useRef(null);
  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

  const adjustHeight = () => {
    if (cardRef.current) {
      cardRef.current.style.height = 'auto';
      const frontHeight = cardRef.current.querySelector('.flip-card-front').scrollHeight;
      const backHeight = cardRef.current.querySelector('.flip-card-back').scrollHeight;
      const maxHeight = Math.max(frontHeight, backHeight);
      cardRef.current.style.height = `${maxHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [isFlipped, editableTask, isEditing]);

  useEffect(() => {
    window.addEventListener('resize', adjustHeight);
    return () => {
      window.removeEventListener('resize', adjustHeight);
    };
  }, []);

  const handleInputChange = (e, key) => {
    const value = e.target.value;
    // Set to null if the input value is empty
    setEditableTask({ ...editableTask, [key]: value === '' ? null : value });
  };

  const handleSave = async () => {
    try {
      await axios.put('/api/backlog', { id: task._id, updatedItem: editableTask });
      onEdit(editableTask);
      setIsEditing(false);
      adjustHeight(); // Recalculate height after saving
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

  const handleCardClick = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('button')) {
      e.stopPropagation();
      return;
    }
    setIsFlipped(!isFlipped);
  };

  const setCompleteDateToToday = async (e) => {
    e.stopPropagation();
    const updatedTask = { ...editableTask, "Complete Date": today };
    setEditableTask(updatedTask);
    try {
      await axios.put('/api/backlog', { id: task._id, updatedItem: updatedTask });
      onEdit(updatedTask);
    } catch (err) {
      console.error('Error setting complete date:', err);
    }
  };

  const setDueDateToTomorrow = async (e) => {
    e.stopPropagation();
    const updatedTask = { ...editableTask, "Due Date": tomorrow };
    setEditableTask(updatedTask);
    try {
      await axios.put('/api/backlog', { id: task._id, updatedItem: updatedTask });
      onEdit(updatedTask);
    } catch (err) {
      console.error('Error setting complete date:', err);
    }
  };

  return (
    <div
      ref={cardRef}
      className="flip-card relative w-full max-w-[1000px] mx-auto mb-4 p-1 bg-gradient-to-br from-purple-500 via-cyan-500 to-fuchsia-400 rounded-xl cursor-pointer perspective-1000 shadow-sm shadow-neutral-400 overflow-hidden "
      onClick={handleCardClick}
    >
      <div
        className={`flip-card-inner text-black transition-transform duration-700 h-full p-1 relative ${isFlipped ? 'rotate-x-180' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face */}
        <div
          className={`flip-card-face flip-card-front bg-slate-100 p-4 rounded-xl shadow-lg absolute inset-0 border border-slate-900 ${isFlipped ? 'hidden' : 'block'} bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat shadow-2xl transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms]`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className='flex flex-row justify-start items-center border-b border-cyan-600 text-black pb-3'>

            <p className='mr-2 bg-gradient-to-r from-purple-500 via-red-500 to-pink-500 rounded-lg px-1 font-semibold text-white text-sm border border-neutral-400 drop-shadow-md'>{editableTask["Priority"]}</p>
            
            <input
            type="checkbox"
            checked={editableTask["Complete Date"] === today}
            onChange={setCompleteDateToToday}
            className="bg-cyan-700 text-white rounded-lg  hover:bg-cyan-800 w-auto mr-2 my-auto text-sm"
          />

            <h2 className="font-bold text-md flex-1 text-black">{isEditing ?
              <input
                type="text"
                value={editableTask["Task Name"] || ''}
                onChange={(e) => handleInputChange(e, "Task Name")}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                onClick={(e) => e.stopPropagation()}
              />
              : editableTask["Task Name"]}</h2>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="absolute top-4 right-5 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:text-black border border-cyan-200 text-white rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className='flex flex-col md:flex-row text-sm mb-2 md:mb-0 border-b border-cyan-600'>
            <div className='flex flex-col pl-1 pr-3 md:border-r md:border-cyan-600 w-full pt-2 pb-2'>
              <p className='text-left text-black'>
                <strong>Due Date:</strong> {isEditing ?
                  <input
                    type="text"
                    value={editableTask["Due Date"] || ''}
                    onChange={(e) => handleInputChange(e, "Due Date")}
                    className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                  : editableTask["Due Date"]}
              </p>
            </div>

            <p className='text-left md:w-full ml-1 md:ml-3 pt-2 pb-2 text-black'>
              <strong>Notes:</strong> {isEditing ?
                <textarea
                  value={editableTask["Notes"] || ''}
                  onChange={(e) => handleInputChange(e, "Notes")}
                  className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                  onClick={(e) => e.stopPropagation()}
                />
                : editableTask["Notes"]}
            </p>
          </div>

          <button
            onClick={setCompleteDateToToday}
            className="mt-4 bg-cyan-700 text-white rounded-lg px-4 py-2 hover:bg-cyan-800 w-full text-sm"
          >
            Complete
          </button>
          
          

          <button
            onClick={setDueDateToTomorrow}
            className="mt-4 bg-cyan-700 text-white rounded-lg px-4 py-2 hover:bg-cyan-800 w-full text-sm"
          >
            Tomorrow
          </button>


          <div className='h-5'></div>
        </div>

        {/* Back Face */}
        <div
          className={`flip-card-face flip-card-back bg-slate-100 p-4 rounded-lg shadow-lg absolute inset-0 ${isFlipped ? 'block' : 'hidden'}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className='flex flex-row justify-between items-center border-b border-cyan-600 mb-3 pb-3'>
            <h2 className="font-bold text-black text-md flex-1">{editableTask["Task Name"]}</h2>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="absolute top-4 right-5 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:text-black border border-cyan-200 text-white  rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex flex-col flex-1 overflow-auto text-sm">
            {Object.keys(editableTask).map((key, index) => (
              key !== "Task Name" && key !== "_id" && (
                <p className='text-left mb-2 text-black' key={index}>
                  <strong>{key}:</strong> {isEditing ?
                    <input
                      type="text"
                      value={editableTask[key] || ''}
                      onChange={(e) => handleInputChange(e, key)}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                    : editableTask[key]}
                </p>
              )
            ))}
            {isEditing ? (
              <button
                onClick={handleSave}
                className="mt-3 bg-cyan-700 text-white rounded-lg px-4 py-2 hover:bg-cyan-800"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 bg-cyan-700 text-white rounded-lg px-4 py-2 hover:bg-cyan-800"
              >
                Edit
              </button>
            )}
            <div className='h-5'></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
