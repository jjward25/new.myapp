// src/app/page.tsx
import React from 'react';
import Routines from '../components/routines/Routines';
import Weather from '../components/Weather';
import TaskListWrapHome from '../components/tasks/TaskClientWrapHome';
import TaskListWrapText from '../components/tasks/textbox/TaskClientWrapTextBox';
import TaskListWrapToday from '../components/tasks/TaskClientWrapToday';
import TaskTrendChart from '../components/d3/TaskTrendChart';
import RoutinesBooleanBar from '../components/d3/RoutinesBarChart';
import DateUpdater from '../components/dates/HomeDate'
import {getToday,getTomorrow} from '../utils/Date'
import AddNewTaskForm from '../components/tasks/NewTaskButton';
import Calendar from '@/components/calendar/calendar';

export const revalidate = 60 * 60; // Regenerate the page every hour

export default async function Home() {
  // Fetch dates on the server side
  const today = await getToday();
  const tomorrow = await getTomorrow();

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-6 w-full h-full">
      <h1 className="text-5xl font-semibold bg-clip-text text-transparent bg-cyan-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-4 mb-10 md:mb-10">
        {`Joe's Life`}
      </h1>
      
      <DateUpdater/>
      <Weather/>


      <div className="flex flex-col w-full h-full mb-10 justify-center">
        <div className="bg-gradient-to-r from-cyan-900 to-cyan-300 h-[2px]"></div> 

        <div className='flex flex-col md:flex-row pt-3'>
          <div className='w-full bg-gradient-to-br from-black via-slate-950 to-black max-w-[750px] rounded-xl mb-4 border border-cyan-300 md:mr-3'>
            <p className='ml-5 mt-3 text-white text-md'>Daily Routines</p>
            <RoutinesBooleanBar/>
          </div>

          <div className='w-full bg-gradient-to-br from-black via-slate-950 to-black max-w-[750px] rounded-xl mb-4 border border-cyan-300 md:ml-3'>
            <p className='ml-5 mt-3 text-white text-md'>Tasks Completed by Day</p>
            <TaskTrendChart/>
          </div>
          
        </div>

        <div className="bg-gradient-to-r from-cyan-900 to-cyan-300 h-[2px] mb-3"></div> 


        <div className='w-full md:grid md:grid-cols-2'>

          <div className='flex flex-col items-center mx-auto mt-4 col-span-1 w-full px-4'>
            <div className='mb-2 w-full'><AddNewTaskForm onTaskAdded={''}/></div>
            <TaskListWrapToday
                completeDateFilter={false}
                typeFilter={['Task']}
                dueDateFilter={today}
                isOpen={true}
                title="Today's Tasks"
            />
            <Routines/>
            
            
            <TaskListWrapHome
              completeDateFilter={null}
              typeFilter={['List']}
              title="List Notes"
            />
          </div>

          <div className='px-4 md:border-l-2 md:border-cyan-600 border-t-2 border-cyan-600 mt-4 md:mt-0 md:border-t-0'>
            <Calendar/>
            
          </div>
        </div>

      </div>

    </main>
  );
}
