"use client";
import React, { useState, useEffect } from 'react';
import TaskListWrap from '../../components/tasks/TaskClientWrapStyle2';

export default function Backlog() {
  const [today, setToday] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3000';

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const todayResponse = await fetch(`${baseUrl}/api/dates/today`);
        const tomorrowResponse = await fetch(`${baseUrl}/api/dates/tomorrow`);

        const todayData = await todayResponse.json();
        const tomorrowData = await tomorrowResponse.json();

        setToday(todayData.today);
        setTomorrow(tomorrowData.tomorrow);
      } catch (error) {
        console.error('Error fetching dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, [baseUrl]);

  if (loading) {
    return <p>Loading...</p>;
  }

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
