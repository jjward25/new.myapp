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
      <div className="cursor-pointer flex items-center justify-between p-2 bg-gradient-to-br from-purple-500 via-cyan-500 to-pink-600 rounded-lg mb-3" onClick={toggleOpen}>
      <p className={`${isOpen ? 'text-cyan-200' : 'text-neutral-800'} hover:text-cyan-200 text-xl md:text-3xl font-semibold`}>
      {`Daily Check-In`}
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
        <div className='flex flex-col items-center max-w-[750px] mx-auto'>
          <AddRoutineButton />
          <RoutineCardList />
        </div>
      )}
    </div>
  );
};

export default Routines;
