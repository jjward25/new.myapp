// src/app/page.tsx
import React from 'react';
import Routines from '../components/routines/Routines';
import Weather from '../components/Weather';
import TaskListWrapHome from '../components/tasks/TaskClientWrapList';
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
      <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-cyan-700 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-0 mb-10 md:mb-10 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat  transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms] text-center">
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

        {/** Main Components List */}
        <div className="bg-gradient-to-r from-cyan-900 to-cyan-300 h-[2px] mb-4"></div> 
        <div className='w-full md:grid md:grid-cols-2'>
          
          {/** Column 1 */}
          <div className='flex flex-col items-center mx-auto col-span-1 w-full md:px-4 md:pl-0'>
            
            <div className='w-full overflow-hidden '>
                <div className="cursor-pointer relative rounded-lg w-full overflow-hidden md:mt-1 mb-2">
                  <div className="absolute -inset-1 rounded-lg bg-yellow-700 blur opacity-20 overflow-hidden"></div>
                  <a href="/workouts" title="Workout">
                    <div className="relative  rounded-lg flex justify-around border-2 border-yellow-950 dark:text-yellow-500 font-semibold overflow-hidden text-sm hover:tracking-widest hover:text-yellow-600 text-yellow-950">
                        Workout
                    </div>
                  </a>
                </div>
                <div className='border-t-2 border-cyan-600 mt-4 pt-4'>
                  <Routines/> 
                </div>
              </div>
          
          </div>

          {/** Column 2 */}
          <div className='md:px-4 md:pr-0 md:border-l-2 md:border-cyan-600 border-t-2 border-cyan-600 pt-5 md:pt-0 mt-3 md:mt-0 md:border-t-0'>

            <div className='mb-2 md:mb-4 w-full'><AddNewTaskForm onTaskAdded={''}/></div>
            <div className='pb-2 border-b-2 border-cyan-600'>
              <TaskListWrapToday
                  completeDateFilter={false}
                  typeFilter={['Task']}
                  dueDateFilter={today}
                  isOpen={true}
                  title="Today's Tasks"
              />
              <TaskListWrapToday
                  completeDateFilter={false}
                  typeFilter={['Task']}
                  dueDateFilter={tomorrow}
                  isOpen={false}
                  title="Tomorrow's Tasks"
              />
              <TaskListWrapHome
                completeDateFilter={null}
                typeFilter={['List']}
                title="List Notes"
              />
            </div>
            <Calendar/>
          </div>

        </div>
      </div>

    </main>
  );
}
