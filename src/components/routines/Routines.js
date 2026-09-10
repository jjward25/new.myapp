// app/components/routines/Routines.js
'use client';

import React, { useState } from 'react';
import AddRoutineButton from './NewButton';
import RoutineCardList from './RoutineCardList';

const Routines = () => {
  const [isOpen, setIsOpen] = useState(true); // Default to open/closed

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="mc-panel flex flex-col w-full mb-2">
      <button
        onClick={toggleOpen}
        className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.08] text-left"
      >
        <span className="mc-label">Daily Check-In</span>
        <svg
          className={`w-4 h-4 ml-auto text-[#5b626d] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="flex flex-col px-3 py-3 max-w-[750px] w-full mx-auto gap-3">
          <AddRoutineButton />
          <RoutineCardList />
        </div>
      )}
    </div>
  );
};

export default Routines;
