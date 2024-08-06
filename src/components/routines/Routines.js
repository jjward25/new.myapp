// app/components/routines/Routines.js
'use client';

import React, { useState } from 'react';
import AddRoutineButton from './NewButton';
import RoutineCardList from './RoutineCardList';

const Routines = () => {
  const [isOpen, setIsOpen] = useState(false); // Default to open

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className='w-full'>
      <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg bg-gradient-to-br from-cyan-600 to-fuchsia-300':'rounded-lg bg-gradient-to-tr from-cyan-300 via-neutral-300 to-cyan-300'} cursor-pointer flex items-center drop-shadow-lg justify-between p-2 dark:bg-black opacity-90`} onClick={toggleOpen}>
        <p className={`${isOpen ? 'text-black' : 'text-neutral-800'} text-xl md:text-2xl font-semibold`}>
        {`Daily Check-In`}
        </p>
        <svg
          className={`w-6 h-6 transition-transform duration-300 transform rotate-180 ${isOpen ? 'transform rotate-0' : ''}`}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <circle cx="12" cy="12" r="10" className={`${isOpen ? 'fill-fuchsia-700' : 'fill-black'}`} />
          <path d="M8 12l4 4 4-4" className="stroke-current text-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={`px-2 ${isOpen ? 'bg-gradient-to-tr from-cyan-700 to-fuchsia-300 rounded-br-lg rounded-bl-lg':''} pt-2`}>
      {isOpen && (
        <div className='flex flex-col items-center max-w-[750px] mx-auto'>
          <AddRoutineButton />
          <RoutineCardList />
        </div>
      )}
      </div>
    </div>
  );
};

export default Routines;
