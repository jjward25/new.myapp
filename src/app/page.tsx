//src/app.page.tsx
import React from 'react';
import Routines from '../components/routines/Routines';
import Weather from '../components/Weather';
import TaskListWrap from '../components/tasks/TaskClientWrapHome';
import TaskListWrap2 from '../components/tasks/TaskClientWrapHome2';
import DateUpdater from '../components/Date'
import TaskTrendChart from '../components/d3/TaskTrendChart'

export default function Home() {
  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]; // Format as YYYY-MM-DD


  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-6 w-full h-full">
      <h1 className="text-5xl font-semibold bg-clip-text text-transparent bg-cyan-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-4 mb-10 md:mb-14 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat shadow-2xl transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms]">
        {`Joe's Life`}
      </h1>

      <DateUpdater/>
      <Weather/>

      

      <div className="flex flex-col w-full h-full mb-10 justify-center">
        <div className="bg-gradient-to-r from-cyan-900 to-cyan-300 h-[2px] mb-3"></div>

        <div className='w-full md:grid md:grid-cols-2'>
          <div className='flex flex-col md:mr-5 items-center max-w-[1000px]'>
            
            <div className='w-full bg-gradient-to-br from-black via-slate-950 to-black max-w-[750px] rounded-xl mb-4 border border-cyan-300'>
              <p className='ml-5 mt-3 text-white text-md'>Personal History</p>
              <TaskTrendChart/>
            </div>

            <TaskListWrap2
              completeDateFilter={null}
              typeFilter={['Event']}
              dueDateFromFilter={today}
              title="Upcoming Events"
            />
            <TaskListWrap2
              completeDateFilter={null}
              typeFilter={['Task']}
              dueDateFilter={tomorrow}
              title="Tomorrow's Tasks"
            />
            <TaskListWrap2
              completeDateFilter={null}
              typeFilter={['List']}
              title="Quick List"
            />
          </div>
          <div className='flex flex-col md:ml-5 items-center max-w-[1000px]'>
          <Routines/>
            <TaskListWrap2
                completeDateFilter={false}
                typeFilter={['Task']}
                dueDateFilter={today}
                isOpen={true}
                title="Today's Tasks"
            />
            
          </div>
        </div>
      </div>
    </main>
  );
}
