"use client";

import React, { useState, useEffect } from 'react';
import { getCurrentFormattedDate } from '../../utils/Date';
import TaskListWrap from '../../components/tasks/TaskClientWrapStyle2'

const Backlog = () => {
  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">

      <h1 className="text-5xl font-semibold bg-clip-text text-transparent bg-cyan-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-4 mb-10 md:mb-10 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat shadow-2xl transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms]">
        Task Backlog
      </h1>
      <p className='text-white py-4 mb-14 w-full max-w-[750px] text-center'>{getCurrentFormattedDate()}</p>

      <div className="flex flex-col w-full h-full mb-10">
        <TaskListWrap completeDateFilter={null} typeFilter={['Task']} dueDateFromFilter={today} title="Open Tasks" />
      </div>

      <div className="flex flex-col w-full h-full mb-10">
        <TaskListWrap completeDateFilter={true} typeFilter={['Task']} title="Completed Tasks" />
      </div>

      <div className="flex flex-col w-full h-full mb-10">
        <TaskListWrap completeDateFilter={null} typeFilter={['Task']} dueDateBeforeFilter={today} title="Missed Tasks" />
      </div>

    </main>
  );
};

export default Backlog;
