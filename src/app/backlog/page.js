// src/app/backlog/page.tsx or src/app/backlog.tsx
import React from 'react';
import TaskListWrap from '../../components/tasks/TaskClientWrapStyle2';
import { getToday, getTomorrow } from '../../utils/Date';

export const revalidate = 60 * 60; // Regenerate the page every hour

export default async function Backlog() {
  // Fetch dates on the server side
  const today = await getToday();
  const tomorrow = await getTomorrow();

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">
      <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-cyan-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-2 mb-10 md:mb-16 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat  transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms] text-center">
        Task Backlog
      </h1>

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
}
