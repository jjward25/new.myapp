'use client';

import React, { useState } from 'react';
import ListTemplate from './TaskList';
import AddNewTaskForm from './NewTaskButton';

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
  isOpen: initialIsOpen = false, // Default value for isOpen
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
    <div className='flex flex-col w-full justify-start mb-3'>
      <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg bg-gradient-to-br from-cyan-600 to-fuchsia-300':'rounded-lg bg-gradient-to-tr from-cyan-300 via-neutral-300 to-cyan-300'} cursor-pointer flex items-center justify-between p-2 dark:bg-black opacity-90`} onClick={toggleOpen}>
        <p className={`${isOpen ? 'text-black' : 'text-neutral-800'} text-xl md:text-2xl font-semibold`}>
          {title}
        </p>
        <svg
          className={`w-6 h-6 transition-transform duration-300 transform rotate-180 ${isOpen ? 'transform rotate-0' : ''}`}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <circle cx="12" cy="12" r="10" className={`${isOpen ? 'fill-black' : 'fill-black'}`} />
          <path d="M8 12l4 4 4-4" className="stroke-current text-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className={`px-3 ${isOpen ? 'bg-gradient-to-tr from-cyan-700 to-fuchsia-300 rounded-br-lg rounded-bl-lg mb-3':''}`}>
        {isOpen && (
          <div className='mt-3'>
            <AddNewTaskForm onTaskAdded={handleTaskAdded} />
            <div className="flex space-x-1 md:space-x-5 mb-4 border-t border-b border-black py-2 w-full justify-evenly">
              <button
                onClick={() => handleToggleSortOrder('date')}
                className="btn btn-sm btn-outline btn-default text-black hover:text-neutral-400 hover:underline"
              >
                Due Date {internalSortOrder === 'date' && internalDateOrder === 'asc' ? 'Descending' : 'Ascending'}
              </button>
              <button
                onClick={() => handleToggleSortOrder('priority')}
                className="btn btn-sm btn-outline btn-default text-black hover:text-neutral-400 hover:underline"
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
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ListWrap;
