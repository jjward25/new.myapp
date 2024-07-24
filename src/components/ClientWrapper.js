"use client";

import React, { useState } from 'react';
import AddNewTaskForm from './backlog/NewTaskButton';
import BacklogListShort from './backlog/BacklogListShort';

const ClientWrapper = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sortOrder, setSortOrder] = useState('date');
  const [dateOrder, setDateOrder] = useState('asc');
  const [priorityOrder, setPriorityOrder] = useState('asc');

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

  return (
    <div className='flex flex-col w-full h-full justify-start'>
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

      <AddNewTaskForm onTaskAdded={handleTaskAdded} />
      
      <BacklogListShort
        refreshTrigger={refreshTrigger}
        sortOrder={sortOrder}
        dateOrder={dateOrder}
        priorityOrder={priorityOrder}
      />
    </div>
  );
};

export default ClientWrapper;
