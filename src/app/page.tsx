// src/app/page.tsx
import React from 'react';
import Routines from '../components/routines/Routines';
import Weather from '../components/Weather';
import TaskListWrapList from '../components/lists/TaskClientWrapList';
import TaskListWrapToday from '../components/tasks/TaskClientWrapToday';
import TaskTrendChart from '../components/d3/TaskTrendChart';
import RoutinesBooleanBar from '../components/d3/RoutinesBarChart';
import DateUpdater from '../components/dates/HomeDate'
import {getToday,getTomorrow, getYesterday, getDayAfterTomorrow} from '../utils/Date'
import AddNewTaskForm from '../components/tasks/NewTaskButton';
import Calendar from '@/components/calendar/calendar';
import MilestoneList from '@/components/projects/homeList/MilestoneList';
import AddListItemButton from '@/components/lists/AddListItemButton';
import UpperTrend from '@/components/d3/workoutUpperTrend'
import LowerTrend from '@/components/d3/workoutLowerTrend'
import ChatComponent from '@/components/chatbot'
import MilestoneTrendComponent from '@/components/d3/MilestoneTrendComponent';
import AvailableLists from '../components/lists/AvailableLists';

export const revalidate = 60 * 60; // Regenerate the page every hour

export default async function Home() {
  // Fetch dates on the server side
  const today = await getToday();
  const tomorrow = await getTomorrow();
  const yesterday = await getYesterday();
  const twoDays = await getDayAfterTomorrow();

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-6 w-full h-full">
      <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-cyan-700 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-0 mb-10 md:mb-10 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat  transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms] text-center">
        {`Joe's Life`}
      </h1>
      
      <DateUpdater/>
      <Weather/>


      <div className="flex flex-col w-full h-full mb-10 justify-center">

        {/** Calendar */}
        <div className='flex flex-col md:flex-row rounded-md w-full h-full'>
          <Calendar/>
        </div>          
        
        {/** Lists */}
        <div className='flex flex-col md:flex-row gap-2 px-2 bg-cyan-950 rounded-md rounded-tl-none mb-4'>

          <div className='mb-2 md:mb-4 pt-2 w-full'>
            <div className='h-12 pt-2 bg-transparent text-cyan-300 italic opacity-70 text-xl font-semibold text-center'>Tasks & Lists</div>
            <MilestoneList/>
          </div>
          
          <div className='mb-2 md:mb-4 pt-2 w-full'>
            <div className='mb-2'>
              <AddNewTaskForm onTaskAdded={''}/>
            </div>
            <TaskListWrapToday completeDateFilter={null} typeFilter={['Task']} dueDateFromFilter={today} dueDateBeforeFilter={tomorrow} title="Open Tasks" isOpen={true}/>              
            <TaskListWrapToday completeDateFilter={null} typeFilter={['Task']} dueDateFromFilter={yesterday} dueDateBeforeFilter={today} title="Yesterday's Tasks" isOpen={false}/>     
            <TaskListWrapToday completeDateFilter={null} typeFilter={['Task']} dueDateFromFilter={tomorrow} dueDateBeforeFilter={twoDays} title="Tomorrow's Tasks" isOpen={false}/>                       
          </div>

          <div className='mb-2 md:mb-4 pt-2 w-full flex flex-col'>
            <AddListItemButton/>   
            <AvailableLists/>
          </div>
        </div>         

        <div className="bg-gradient-to-r from-cyan-900 to-cyan-300 h-[2px] mt-4"></div> 

        {/** Charts: Project Milestones and Tasks*/}
        <div className='flex flex-col md:flex-row pt-3 gap-4'>
          <div className="p-4 mx-auto bg-gradient-to-tr from-black to-slate-800 rounded-lg w-full">
            <h1 className="text-xl font-semibold text-cyan-800">Tasks Completed by Day</h1>
            <TaskTrendChart/>
          </div>
          <div className=' drop-shadow-sm w-full'>
            <MilestoneTrendComponent/>
          </div>
        </div>

        {/** Main Components List */}
        <div className="bg-gradient-to-r from-cyan-900 to-cyan-300 h-[2px] my-4"></div> 
        <div className='w-full md:grid md:grid-cols-2'>
        
        {/** Column 1: Routines */}
        <div className='w-full md:px-4 md:pr-4 md:pl-0 md:border-r-2 md:border-cyan-600 border-t-2 border-cyan-600 pt-5 md:pt-0 mt-3 md:mt-0 md:border-t-0'>
          <Routines/> 
        </div>

        {/** Column 2: Workout */}
        <div className='flex flex-col items-center mx-auto col-span-1 w-full md:px-4 md:pr-0'>
        
        <div className='w-full h-fit bg-gradient-to-tr from-black to-slate-800 max-w-[750px] rounded-xl mb-4 border border-fuchsia-300 '>
          <p className='ml-5 mt-3 text-white text-md'>Daily Routines</p>
          <RoutinesBooleanBar/>
        </div>
          
        <div className='w-full overflow-hidden '>
            <div className='pb-2'>
              <div className="cursor-pointer relative rounded-lg w-full overflow-hidden md:mt-1 mb-2">
                <div className="absolute -inset-1 rounded-lg bg-yellow-700 blur opacity-20 overflow-hidden"></div>
                <a href="/workouts" title="Workout">
                  <div className="relative  rounded-lg flex justify-around border-2 border-yellow-950 dark:text-yellow-500 font-semibold overflow-hidden text-sm hover:tracking-widest hover:text-yellow-600 text-yellow-950">
                      Workout
                  </div>
                </a>
              </div>
            </div>

            <div className='bg-neutral-200 rounded-md border-2 border-black drop-shadow-sm w-full'>
              <UpperTrend/>
            </div>
            <div className='bg-neutral-200 rounded-md border-2 border-black drop-shadow-sm w-full mt-6'>
              <LowerTrend/>
            </div>              
          </div>
        </div>

        

      </div>

      <div className="bg-gradient-to-r from-cyan-900 to-cyan-300 h-[2px] my-4"></div> 
          
          {/** Chat */}
          <div className='flex flex-col md:flex-row'>
              <ChatComponent/>
          </div>
    </div>
  </main>
  );
}
