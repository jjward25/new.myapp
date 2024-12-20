// src/components/tasks/TaskCard.js
"use client";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const TaskCard = ({ task, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableTask, setEditableTask] = useState({ ...task });
  const [isFlipped, setIsFlipped] = useState(false);

  const cardRef = useRef(null);

  // Function to get today's date in EST formatted as YYYY-MM-DD
  const getTodayInEST = () => {
    const today = new Date();
    const options = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' };
    return today.toLocaleDateString('en-CA', options); // 'en-CA' returns YYYY-MM-DD format
  };
  const today = getTodayInEST();

  // Function to get tomorrow's date in EST formatted as YYYY-MM-DD
  const getTomorrowInEST = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Move to the next day
    const options = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' };
    return tomorrow.toLocaleDateString('en-CA', options); // 'en-CA' returns YYYY-MM-DD format
  };
  const tomorrow = getTomorrowInEST();
  

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

  const DueDatePlusOne = async (e) => {
    e.stopPropagation();
    
    // Extract existing Due Date and create a local date
    const existingDueDateStr = editableTask["Due Date"];
    const existingDueDate = new Date(existingDueDateStr + 'T00:00:00'); // Local time, assuming input is in EST
    
    // Add one day to the existing Due Date
    existingDueDate.setDate(existingDueDate.getDate() + 1);
    
    // Format the new date as YYYY-MM-DD
    const options = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' };
    const newDueDate = existingDueDate.toLocaleDateString('en-CA', options); // Use 'en-CA' for YYYY-MM-DD

    // Update the editableTask with the new Due Date
    const updatedTask = { ...editableTask, "Due Date": newDueDate };
    
    try {
        const response = await axios.put('/api/backlog', { id: task._id, updatedItem: updatedTask });
        onEdit(updatedTask);
    } catch (err) {
        console.error('Error setting due date to tomorrow:', err);
    }
};


  

  const repeatTask = async (e) => {
    e.stopPropagation();
    const newTask = { ...editableTask, "Due Date": tomorrow, _id: undefined }; // Set Due Date to tomorrow and remove the ID
    try {
      const response = await axios.post('/api/backlog', newTask);
      // Optionally, you can also call onEdit here to update the state, or fetch the new tasks list
      console.log('New task created:', response.data);
    } catch (err) {
      console.error('Error duplicating task:', err);
    }
  };

  return (
    <div
      ref={cardRef}
      className="flip-card relative w-full max-w-[1000px] mx-auto border border-neutral-200 rounded-xl cursor-pointer perspective-1000 shadow-sm shadow-neutral-400 overflow-hidden mb-2"
      onClick={handleCardClick}
    >
      <div
        className={`flip-card-inner text-black transition-transform duration-700 h-full p-1 relative ${isFlipped ? 'rotate-x-180' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face */}
        <div
          className={`flip-card-face flip-card-front bg-slate-200 rounded-xl shadow-lg absolute inset-0 border border-slate-900 ${isFlipped ? 'hidden' : 'block'} bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat shadow-2xl transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms]`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/** Front Card Content */}
          <div className='flex flex-col justify-start items-center text-black pb-2'>
          {/** Action Buttons */}
          <div className='flex flex-row w-full justify-between md:justify-start'>
            <p className='mx-2 mt-[9px] mb-auto bg-gradient-conic from-slate-900 via-cyan-900 to-slate-900 rounded-lg px-1 font-semibold text-white text-xs border border-neutral-400 drop-shadow-md'>{editableTask["Priority"]}</p>
            
            <input
              type="checkbox"
              checked={editableTask["Complete Date"] === today}
              onChange={setCompleteDateToToday}
              className="bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 w-auto mr-2 text-sm transform scale-150 cursor-grab mt-3 mb-auto"
              title="Mark Completed Today"
            />

            <button
              onClick={DueDatePlusOne}
              className="bg-cyan-700 text-white rounded-lg px-2 hover:bg-cyan-800 w-auto text-sm mt-2 mb-auto mr-2"
              title="Move to Tomorrow"
            >
              +1
            </button>

            <button
              onClick={repeatTask}
              className="bg-cyan-700 text-white rounded-lg px-2 hover:bg-cyan-800 w-auto text-sm mt-2 mb-auto mr-2"
              title="Duplicate Task Tomorrow"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v6h6" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="mt-2 mb-auto mr-2 bg-gradient-conic from-slate-900 via-cyan-900 to-slate-900 hover:text-cyan-200 border border-cyan-200 text-white rounded-lg cursor-pointer"
              title="Delete Task"
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

            <h2 className="font-bold text-sm flex-1 text-black ml-3 mr-2 mt-[6px] w-full pl-2">{isEditing ? (
              <input
                type="text"
                value={editableTask["Task Name"] || ''}
                onChange={(e) => handleInputChange(e, "Task Name")}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-auto text-left"
                onClick={(e) => e.stopPropagation()}
              />
            ) : editableTask["Task Name"]}</h2>

            
          </div>
          

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
              key !== "Task Name" && key !== "_id" && key !== 'Project' && key !== 'Start Date' && (
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
