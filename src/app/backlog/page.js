"use client";

import React, { useState, useEffect } from 'react';
import BacklogList from '../../components/tasks/ListBacklog';
import AddNewTaskForm from '../../components/tasks/NewTaskButton';
import { getCurrentFormattedDate } from '../../components/date';
import BacklogListCompleted from '../../components/tasks/ListCompleted';

const Backlog = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('date');
  const [dateOrder, setDateOrder] = useState('asc');
  const [priorityOrder, setPriorityOrder] = useState('asc');
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleToggleSortOrder = (type) => {
    if (type === 'date') {
      setDateOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
      setSortOrder('date');
    } else if (type === 'priority') {
      setPriorityOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
      setSortOrder('priority');
    }
    setRefreshTrigger(prev => !prev); // Trigger refresh
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">
      <h1 className="hover:scale-150 text-5xl font-semibold text-slate-800 mt-2 mb-10 bg-clip-text text-transparent bg-gradient-radial from-purple-500 via-cyan-500 to-pink-600 drop-shadow-md">
        Task Backlog
      </h1>
      <p className='text-white mb-10'>{getCurrentFormattedDate()}</p>

      <div className="flex flex-col w-full h-full mb-10">

        <h1 className="text-xl md:text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">
          Open Tasks
        </h1>
        <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px] mb-8"></div>
        
        <div className='flex flex-col items-center md:w-[750px] max-w-[750px] mx-auto'>
          <div className="flex space-x-5 mb-8 border-t border-b border-neutral-500 py-2 w-full justify-evenly max-w-[1000px]">
            <button
              onClick={() => handleToggleSortOrder('date')}
              className="btn btn-sm btn-outline btn-default text-neutral-500 hover:text-neutral-400 hover:underline"
            >
              Due Date {sortOrder === 'date' && dateOrder === 'asc' ? 'Descending' : 'Ascending'}
            </button>
            <button
              onClick={() => handleToggleSortOrder('priority')}
              className="btn btn-sm btn-outline btn-default text-neutral-500 hover:text-neutral-400 hover:underline"
            >
              Priority {sortOrder === 'priority' && priorityOrder === 'asc' ? 'Descending' : 'Ascending'}
            </button>
          </div>

          <AddNewTaskForm />
          <div className='h-4'></div>
          <BacklogList
            refreshTrigger={refreshTrigger}
            sortOrder={sortOrder}
            dateOrder={dateOrder}
            priorityOrder={priorityOrder}
          />
        </div>

      </div>

      <div className="flex flex-col w-full h-full mb-10">

        <h1 className="text-xl md:text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">
          Completed Tasks
        </h1>
        <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px] mb-8"></div>
        
        <div className='flex flex-col items-center md:w-[750px] max-w-[750px] mx-auto'>
          <div className='h-4'></div>
          <BacklogListCompleted
            refreshTrigger={refreshTrigger}
            sortOrder={sortOrder}
            dateOrder={dateOrder}
            priorityOrder={priorityOrder}
          />
        </div>

      </div>
    </main>
  );
};

export default Backlog;
