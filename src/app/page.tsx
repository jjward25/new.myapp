//src/app.page.tsx
import React from 'react';
import { getCurrentDate, getTomorrowDate } from '../utils/Date';
import Routines from '../components/routines/Routines';
import Weather from '../components/Weather';
import TaskListWrap from '../components/tasks/TaskClientWrap';
import DateUpdater from '../components/Date'

export default function Home() {
  const today = getCurrentDate(); // 'YYYY-MM-DD'
  const tomorrow = getTomorrowDate(); // 'YYYY-MM-DD'

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-6 w-full h-full">
      <h1 className="hover:animate-spin text-5xl font-semibold text-cyan-700 mt-6 md:mt-2 mb-10 drop-shadow-md">
        {`Joe's Life`}
      </h1>

      <DateUpdater/>
      <Weather/>

      <div className="flex flex-col w-full h-full mb-10 justify-center">
        <div className="bg-gradient-to-r from-cyan-900 to-cyan-300 h-[2px] mb-3"></div>

        <div className='w-full md:grid md:grid-cols-2'>
          <div className='flex flex-col md:mr-5 items-center max-w-[1000px]'>
            <TaskListWrap
              completeDateFilter={null}
              typeFilter={['List']}
              title="Quick List"
            />
            <TaskListWrap
              completeDateFilter={false}
              typeFilter={['Task']}
              dueDateFilter={today}
              isOpen={true}
              title="Today's Tasks"
            />
            <TaskListWrap
              completeDateFilter={null}
              typeFilter={['Task']}
              dueDateFilter={tomorrow}
              title="Tomorrow's Tasks"
            />
          </div>
          <div className='flex flex-col md:ml-5 items-center max-w-[1000px]'>
            <TaskListWrap
              completeDateFilter={null}
              typeFilter={['Event']}
              dueDateFromFilter={today}
              title="Upcoming Events"
            />
            <Routines/>
          </div>
        </div>
      </div>
    </main>
  );
}
