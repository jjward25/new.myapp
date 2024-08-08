// src/components/tasks/TaskClientWrap.tsx
'use client';

import React, { useState } from 'react';
import ListTemplate from './TaskList';
import AddNewTaskForm from './NewTaskButton';

// Define the props interface
interface ListWrapProps {
  title: string;
  refreshTrigger?: () => void; // Optional
  sortOrder?: string; // Optional
  dateOrder?: string; // Optional
  priorityOrder?: string; // Optional
  dueDateFilter?: string | null; // Allow null
  priorityFilter?: string[]; // Optional
  typeFilter: string[]; // Required
  completeDateFilter?: boolean | null; // Allow null
  dueDateFromFilter?: string | null; // Allow null
  dueDateBeforeFilter?: string | null; // Allow null
  isOpen?: boolean; // Optional
}

const ListWrap: React.FC<ListWrapProps> = ({
  title,
  refreshTrigger,
  sortOrder = 'date',
  dateOrder = 'asc',
  priorityOrder = 'asc',
  dueDateFilter = null,
  priorityFilter = [],
  typeFilter,
  completeDateFilter = null,
  dueDateFromFilter = null,
  dueDateBeforeFilter = null,
  isOpen: initialIsOpen = false,
}) => {
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);
  const [internalSortOrder, setInternalSortOrder] = useState(sortOrder);
  const [internalDateOrder, setInternalDateOrder] = useState(dateOrder);
  const [internalPriorityOrder, setInternalPriorityOrder] = useState(priorityOrder);
  const [isOpen, setIsOpen] = useState(initialIsOpen);

  const handleTaskAdded = () => {
    setInternalRefreshTrigger(prev => prev + 1);
    if (refreshTrigger) refreshTrigger();
  };

  const handleToggleSortOrder = (type: 'date' | 'priority') => {
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

  // Convert date strings to ISO format
  const parseDate = (dateString: string | null | undefined): string | undefined => {
    return dateString ? new Date(dateString).toISOString().split('T')[0] : undefined;
  };

  const dueDateFilterDate = parseDate(dueDateFilter);
  const dueDateFromFilterDate = parseDate(dueDateFromFilter);
  const dueDateBeforeFilterDate = parseDate(dueDateBeforeFilter);
  const completeDateFilterDate = completeDateFilter;

  return (
    <div className='flex flex-col w-full justify-start mb-3'>
      <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg border border-neutral-200' : 'text-white hover:text-cyan-600 border border-cyan-200 rounded-lg'} bg-gradient-to-br from-cyan-950 via-black to-fuchsia-950 drop-shadow-lg cursor-pointer flex items-center justify-between p-2 dark:bg-black opacity-90`} onClick={toggleOpen}>
        <p className={`${isOpen ? 'text-cyan-500' : ''} text-lg md:text-xl font-semibold hover:text-cyan-500 pl-1`}>
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

      <div className={`px-5 ${isOpen ? 'bg-transparent rounded-br-lg border border-white rounded-bl-lg mb-5' : ''}`}>
        {isOpen && (
          <div className='mt-5'>
            
            <AddNewTaskForm onTaskAdded={handleTaskAdded} />
            
            <div className="flex space-x-1 md:space-x-5 mb-4 mt-3  border-white py-2 w-full justify-evenly">
              <button
                onClick={() => handleToggleSortOrder('date')}
                className="btn btn-sm btn-outline btn-default text-white hover:text-neutral-400 hover:underline"
              >
                Due Date {internalSortOrder === 'date' && internalDateOrder === 'asc' ? 'Descending' : 'Ascending'}
              </button>
              <button
                onClick={() => handleToggleSortOrder('priority')}
                className="btn btn-sm btn-outline btn-default text-white hover:text-neutral-400 hover:underline"
              >
                Priority {internalSortOrder === 'priority' && internalPriorityOrder === 'asc' ? 'Descending' : 'Ascending'}
              </button>
            </div>

            <ListTemplate
              refreshTrigger={internalRefreshTrigger}
              sortOrder={internalSortOrder}
              dateOrder={internalDateOrder}
              priorityOrder={internalPriorityOrder}
              dueDateFilter={dueDateFilterDate}
              priorityFilter={priorityFilter}
              typeFilter={typeFilter}
              completeDateFilter={completeDateFilterDate}
              dueDateFromFilter={dueDateFromFilterDate}
              dueDateBeforeFilter={dueDateBeforeFilterDate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ListWrap;
