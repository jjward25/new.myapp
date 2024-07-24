import React from 'react';
import { getCurrentFormattedDate } from '../components/date';
import Routines from '../components/routines/Routines';
import ClientWrapper from '../components/tasks/ClientWrappers/DailyTaskClientWrapper';
import ListClientWrapper from '../components/tasks/ClientWrappers/ListClientWrapper';
import EventsClientWrapper from '../components/tasks/ClientWrappers/EventsClientWrapper';


export default function Home() {
  const today = getCurrentFormattedDate();

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">
      <h1 className="hover:animate-spin text-5xl font-semibold text-slate-800 mt-2 mb-10 bg-clip-text text-transparent bg-gradient-radial from-purple-500 via-cyan-500 to-pink-600 drop-shadow-md">
        {`Joe's Life`}
      </h1>
      <p className="text-white mb-10">{today}</p>

      
          
      <div className="flex flex-col w-full h-full mb-10 justify-center">
    
        <div className="bg-gradient-to-r from-cyan-900 to-cyan-300 h-[2px] mb-3"></div>

        <div className='w-full md:grid md:grid-cols-2'>
          
          <div className='flex flex-col md:mr-5 items-center max-w-[1000px]'>
            <ListClientWrapper/>
            <ClientWrapper />
          </div>
          <div className='flex flex-col md:ml-5 items-center max-w-[1000px]'>
            <EventsClientWrapper/>
            <Routines/>
          </div>
        </div>
      </div>

    </main>
  );
}

