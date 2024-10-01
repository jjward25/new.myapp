// src/components/tasks/TaskClientWrapStyle2.js
'use client';

import React, { useState } from 'react';
import ListTemplate from './TaskListMissed';

const ListWrap = ({
  title,
  refreshTrigger,
  sortOrder,
  dateOrder,
  priorityOrder,
  dueDateFilter,
  priorityFilter,
  typeFilter,
  completeDateFilter,
  dueDateFromFilter,
  dueDateBeforeFilter,
  isOpen: initialIsOpen = false,
}) => {
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);
  const [internalSortOrder, setInternalSortOrder] = useState(sortOrder || 'date');
  const [internalDateOrder, setInternalDateOrder] = useState(dateOrder || 'asc');
  const [internalPriorityOrder, setInternalPriorityOrder] = useState(priorityOrder || 'asc');
  const [isOpen, setIsOpen] = useState(initialIsOpen);

  const handleTaskAdded = () => {
    setInternalRefreshTrigger(prev => prev + 1);
    if (refreshTrigger) refreshTrigger();
  };

  const handleToggleSortOrder = (type) => {
    if (type === 'date') {
      setInternalDateOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
      setInternalSortOrder('date');
    } else if (type === 'priority') {
      setInternalPriorityOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
      setInternalSortOrder('priority');
    }
  };

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className='flex flex-col w-full max-w-[750px] justify-start mx-auto'>
      <div className="cursor-pointer flex items-center justify-between p-2 mb-3 border-b-2 border-purple-500" onClick={toggleOpen}>
        <p className={`${isOpen ? '' : ''} w-full text-xl md:text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700`}>
          {title}
        </p>
        <svg
          className={`w-6 h-6 transition-transform duration-300 transform rotate-180 ${isOpen ? 'transform rotate-2' : ''}`}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <circle cx="12" cy="12" r="10" className={`${isOpen ? 'fill-cyan-600' : 'fill-slate-700'}`} />
          <path d="M8 12l4 4 4-4" className="stroke-current text-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className='px-2'>
        {isOpen && (
          <>
            <div className="flex space-x-1 mb-3 mt-0 border-white pb-2 w-full justify-between">
              <button
                onClick={() => handleToggleSortOrder('date')}
                className="w-1/2 mr-1 md:mr-0 text-xs btn btn-sm btn-outline btn-default text-white hover:text-neutral-400 hover:underline bg-gradient-conic from-slate-900 via-cyan-900 to-slate-900 dark:bg-transparent"
              >
                Due Date {internalSortOrder === 'date' && internalDateOrder === 'asc' ? 'Descending' : 'Ascending'}
              </button>
              <button
                onClick={() => handleToggleSortOrder('priority')}
                className="w-1/2 ml-1 md:ml-0 text-xs btn btn-sm btn-outline btn-default text-white hover:text-neutral-400 hover:underline bg-gradient-conic from-slate-900 via-cyan-900 to-slate-900 dark:bg-transparent"
              >
                Priority {internalSortOrder === 'priority' && internalPriorityOrder === 'asc' ? 'Descending' : 'Ascending'}
              </button>
            </div>

            <ListTemplate
              refreshTrigger={internalRefreshTrigger}
              sortOrder={internalSortOrder}
              dateOrder={internalDateOrder}
              priorityOrder={internalPriorityOrder}
              dueDateFilter={dueDateFilter}
              priorityFilter={priorityFilter}
              typeFilter={typeFilter}
              completeDateFilter={completeDateFilter}
              dueDateFromFilter={dueDateFromFilter}
              dueDateBeforeFilter={dueDateBeforeFilter}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ListWrap;
