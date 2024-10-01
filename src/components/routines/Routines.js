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
    <div className='flex flex-col w-full justify-start mb-2'>

      <div className={`${isOpen ? '':''} cursor-pointer relative rounded-lg w-full overflow-hidden md:mt-1 h-full`} onClick={toggleOpen}>
        <div className="absolute -inset-3  bg-yellow-500 dark:bg-black blur opacity-50"></div>
        <div className={`${isOpen ? '':''} relative rounded-lg flex justify-between px-1 py-1 border-2 border-yellow-800`}>
          
          <p className={`${isOpen ? '' : ''} text-lg font-semibold pl-1 my-0 `}>
            Daily Check-In
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
      
      <div className={`${isOpen ? 'rounded-br-lg rounded-bl-lg':''}`}>
      {isOpen && (

        <div className="relative rounded-bl-md rounded-br-md h-full">
          <div className="flex flex-col relative  mx-auto justify-around max-w-[750px] pt-4">
            <AddRoutineButton />
            <RoutineCardList />
          </div>
        </div>
          
      )}
      </div>
    </div>
  );
};

export default Routines;
