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
  sizeFilter?: string[] | null;
  missedFilter?: boolean | null; // Optional: false = non-missed, true = missed, null = all
}

const ListWrap: React.FC<ListWrapProps> = ({
  title,
  sortOrder = 'priority',
  dateOrder = 'asc',
  priorityOrder = 'asc',
  dueDateFilter = null,
  priorityFilter = [],
  typeFilter,
  completeDateFilter = null,
  dueDateFromFilter = null,
  dueDateBeforeFilter = null,
  isOpen: initialIsOpen = false,
  sizeFilter = [],
  missedFilter = null,
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
    <div className='flex flex-col w-full justify-start mb-2 rounded-md h-fit'>

      <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} cursor-pointer relative w-full overflow-hidden h-full`} onClick={toggleOpen}>
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} absolute -inset-3 bg-cyan-700 blur opacity-20`}></div>
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} relative flex justify-between px-1 py-1 border-2 border-cyan-800 text-cyan-950 dark:text-cyan-500 hover:text-cyan-600`}>
          
          <p className={`${isOpen ? '' : ''} text-lg font-semibold pl-1 my-0 text-white opacity-90`}>
            {title}
          </p>
          
          <svg
            className={`w-6 h-6 mt-1 transition-transform duration-300 transform rotate-180 ${isOpen ? 'transform rotate-2' : ''}`}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" className={`fill-cyan-950 ${isOpen ? '' : ''}`} />
            <path d="M8 12l4 4 4-4" className="stroke-current text-cyan-200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
       
        </div>
      </div>


      <div className={`px-0 ${isOpen ? 'bg-neutral-200 rounded-br-lg rounded-bl-lg pb-3 border-2 border-t-0 border-cyan-700' : ''}`}>
        {isOpen && (
          <div className='mt-4 px-2'>
            
            <div className="flex space-x-1 mb-2 mt-0 border-white pb-2 w-full justify-between px-8">
             
              <button
                onClick={() => handleToggleSortOrder('priority')}
                className="w-full ml-1 md:ml-0 mt-1 text-xs btn btn-sm btn-outline btn-default text-white hover:text-neutral-400 hover:underline bg-gradient-conic from-slate-900 via-cyan-900 to-slate-900 dark:bg-transparent"
              >
                Priority {internalSortOrder === 'priority' && internalPriorityOrder === 'asc' ? 'Descending' : 'Ascending'}
              </button>
            </div>


            {/* All Tasks - sorted by Priority then Size */}
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
              sizeFilter={sizeFilter || []}
              missedFilter={missedFilter}
            />
        
          </div>
        )}
      </div>
    </div>
  );
};

export default ListWrap;
