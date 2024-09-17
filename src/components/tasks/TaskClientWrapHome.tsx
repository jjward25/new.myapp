// src/components/tasks/TaskClientWrap.tsx
'use client';

import React, { useState } from 'react';
import ListTemplate from './TaskList';

// Define the props interface
interface ListWrapProps {
  title: string;
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
  sessionFilter?: string[] | null;
}

const ListWrap: React.FC<ListWrapProps> = ({
  title,
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
  sessionFilter = [],
}) => {
  const [internalSortOrder, setInternalSortOrder] = useState(sortOrder);
  const [internalDateOrder, setInternalDateOrder] = useState(dateOrder);
  const [internalPriorityOrder, setInternalPriorityOrder] = useState(priorityOrder);
  const [isOpen, setIsOpen] = useState(initialIsOpen);

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
    <div className='flex flex-col w-full justify-start mb-2'>
      <div className="cursor-pointer relative rounded-lg w-full overflow-hidden md:my-1 h-full" onClick={toggleOpen}>
        <div className="absolute -inset-3  bg-gradient-to-tr from-cyan-300 via-neutral-300 to-cyan-300 dark:bg-black blur opacity-90"></div>
        <div className="relative rounded-lg flex justify-between px-1 py-1 border-2 border-cyan-800">
          
          <p className={`${isOpen ? '' : ''} text-lg font-semibold pl-1 my-0 `}>
            {title}
          </p>
          
          <svg
            className={`w-6 h-6 mt-1 transition-transform duration-300 transform rotate-180 ${isOpen ? 'transform rotate-2' : ''}`}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" className={`${isOpen ? 'fill-black' : 'fill-black'}`} />
            <path d="M8 12l4 4 4-4" className="stroke-current text-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
       
        </div>
      </div>

      <div className={`px-5 ${isOpen ? 'bg-transparent rounded-br-lg dark:border-white rounded-bl-lg pb-3' : ''}`}>
        {isOpen && (
          <div className='mt-5'>
            
            <div className="flex space-x-1 mb-3 mt-0 border-white pb-2 w-full justify-between">
              <button
                onClick={() => handleToggleSortOrder('date')}
                className="w-1/2 text-xs mr-1 md:mr-0 btn btn-sm btn-outline btn-default text-white hover:text-neutral-400 hover:underline bg-gradient-conic from-slate-900 via-cyan-900 to-slate-900 dark:bg-transparent"
              >
                Due Date {internalSortOrder === 'date' && internalDateOrder === 'asc' ? 'Descending' : 'Ascending'}
              </button>
              <button
                onClick={() => handleToggleSortOrder('priority')}
                className="w-1/2 text-xs ml-1 md:ml-0 btn btn-sm btn-outline btn-default text-white hover:text-neutral-400 hover:underline bg-gradient-conic from-slate-900 via-cyan-900 to-slate-900 dark:bg-transparent"
              >
                Priority {internalSortOrder === 'priority' && internalPriorityOrder === 'asc' ? 'Descending' : 'Ascending'}
              </button>
            </div>

            <ListTemplate
              sortOrder={internalSortOrder}
              dateOrder={internalDateOrder}
              priorityOrder={internalPriorityOrder}
              dueDateFilter={dueDateFilterDate}
              priorityFilter={priorityFilter}
              typeFilter={typeFilter}
              completeDateFilter={completeDateFilterDate}
              dueDateFromFilter={dueDateFromFilterDate}
              dueDateBeforeFilter={dueDateBeforeFilterDate}
              sessionFilter={sessionFilter || []}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ListWrap;
