"use client";

import React, { useState } from 'react';
import AddNewTaskForm from '../NewTaskButton';
import ListList from '../lists/ListList';

const ListClientWrapper = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sortOrder, setSortOrder] = useState('date');
  const [dateOrder, setDateOrder] = useState('asc');
  const [priorityOrder, setPriorityOrder] = useState('asc');
  const [isOpen, setIsOpen] = useState(false);

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
      <p className={`${isOpen ? 'text-cyan-200' : 'text-neutral-800'} 'text-xl md:text-3xl font-semibold`}>
        Quick Lists
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
          <ListList
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

export default ListClientWrapper;
