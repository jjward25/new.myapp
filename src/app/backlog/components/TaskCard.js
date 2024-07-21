// src/app/components/TaskCard.js
import React from 'react';
import './TaskCard.css';

const TaskCard = ({ task }) => {
  return (
    
    <div className="flip-card w-full mx-auto my-2 md:m-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-[2px] rounded-lg">
      <div className="flip-card-inner min-h-[130px]">
        <div className="flip-card-front ">
          <div className='flex flex-row justify-between border-b mb-3'>
            <h2 className="font-bold text-xl mb-2">{task["Task Name"]}</h2>
            <div className="cursor-pointer relative rounded-2xl w-auto py-[3px] px-1 overflow-hidden md:my-1 h-full border border-black">
                <div className="absolute -inset-3  bg-gradient-to-tr from-cyan-300 via-cyan-800 to-cyan-300 dark:bg-black blur opacity-90"></div>
                <div className="relative rounded-lg flex justify-around text-white text-xs">
                  {task["Priority"]}
                </div>
            </div>
          </div>
          <div className='flex flex-col md:flex-row'>
            <div className='flex flex-col mr-5 pr-5 md:border-r'>
              <p className='mb-1 text-left h-0 overflow-hidden md:h-full'><strong>Start Date:</strong> {task["Start Date"]}</p>
              <p className='text-left h-0 overflow-hidden md:h-full'><strong>Due Date:</strong> {task["Due Date"]}</p>
            </div>
            <p className='text-left'><strong>Notes:</strong> {task["Notes"]}</p>
          </div>
        </div>
        <div className="flip-card-back">
          {Object.keys(task).map((key, index) => (
            (key !== "Task Name" && key !== "Start Date" && key !== "Due Date" && key !== "Priority" && key !== "Notes") && (
              <p key={index}><strong>{key}:</strong> {task[key]}</p>
            )
          ))}
        </div>
      </div>

      
    </div>

    
  );
};

export default TaskCard;
