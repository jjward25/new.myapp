"use client";

import React, { useState, useEffect } from 'react';
import { getCurrentFormattedDate } from '../../utils/Date';
import TaskListWrap from '../../components/tasks/TaskClientWrapStyle2'
import { getCurrentDate, getTomorrowDate } from '../../utils/Date'

const Backlog = () => {
  const today = getCurrentDate();
  const tomorrow = getTomorrowDate();

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
      <h1 className="hover:scale-150 text-5xl font-semibold mt-2 mb-10 text-fuchsia-400 drop-shadow-md">
        Task Backlog
      </h1>
      <p className='text-white mb-10'>{getCurrentFormattedDate()}</p>

      <div className="flex flex-col w-full h-full mb-10">
        <TaskListWrap completeDateFilter={null} typeFilter={['Task']} dueDateFromFilter={today} title="Open Tasks" />
      </div>

      <div className="flex flex-col w-full h-full mb-10">
        <TaskListWrap completeDateFilter={true} typeFilter={['Task']} title="Completed Tasks" />
      </div>
    </main>
  );
};

export default Backlog;
