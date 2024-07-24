"use client";

import React, { useState } from 'react';
import AddNewTaskForm from '../NewTaskButton';
import BacklogListShort from '../ListToday';

const ClientWrapper = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sortOrder, setSortOrder] = useState('date');
  const [dateOrder, setDateOrder] = useState('asc');
  const [priorityOrder, setPriorityOrder] = useState('asc');
  const [isOpen, setIsOpen] = useState(true);

  const handleTaskAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleToggleSortOrder = (type) => {
    if (type === 'date') {
      setDateOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
      setSortOrder('date');
    } else if (type === 'priority') {
      setPriorityOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
      setSortOrder('priority');
    }
  };

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className='flex flex-col w-full justify-start'>
      <div className="cursor-pointer flex items-center justify-between p-2 bg-gradient-to-br from-purple-500 via-cyan-500 to-pink-600 rounded-lg mb-3" onClick={toggleOpen}>
        <p className='text-xl md:text-3xl font-semibold text-green-400'>
          {`Today's Tasks`}
        </p>
        <svg
          className={`w-6 h-6 transition-transform duration-300 transform rotate-180 ${isOpen ? 'transform rotate-0' : ''}`}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <circle cx="12" cy="12" r="10" className={`${isOpen ? 'fill-cyan-800' : 'fill-black'}`} />
          <path d="M8 12l4 4 4-4" className="stroke-current text-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {isOpen && (
        <>
          <AddNewTaskForm onTaskAdded={handleTaskAdded} />

          <div className="flex space-x-5 mb-4 border-t border-b border-neutral-500 py-2 w-full justify-evenly">
            <button
              onClick={() => handleToggleSortOrder('date')}
              className="btn btn-sm btn-outline btn-default text-neutral-500 hover:text-neutral-400 hover:underline"
            >
              Start Date {sortOrder === 'date' && dateOrder === 'asc' ? 'Descending' : 'Ascending'}
            </button>
            <button
              onClick={() => handleToggleSortOrder('priority')}
              className="btn btn-sm btn-outline btn-default text-neutral-500 hover:text-neutral-400 hover:underline"
            >
              Priority {sortOrder === 'priority' && priorityOrder === 'asc' ? 'Descending' : 'Ascending'}
            </button>
          </div>

          <BacklogListShort
            refreshTrigger={refreshTrigger}
            sortOrder={sortOrder}
            dateOrder={dateOrder}
            priorityOrder={priorityOrder}
          />
        </>
      )}
    </div>
  );
};

export default ClientWrapper;
