import { getCurrentFormattedDate } from '../components/date';
import Routines from '../components/daily/Routines';
import BacklogListShort from '../components/backlog/BacklogListShort';
import AddNewTaskForm from '../components/backlog/NewButton';

export default function Home() {
  const today = getCurrentFormattedDate();

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">
      <h1 className="hover:animate-spin text-5xl font-semibold text-slate-800 mt-2 mb-10 bg-clip-text text-transparent bg-gradient-radial from-purple-500 via-cyan-500 to-pink-600 drop-shadow-md">
        {`Joe's Life`}
      </h1>
      <p className="text-white mb-10">{today}</p>
      
      <div className="flex flex-col w-full h-full mb-10 justify-center">
        <h1 className="text-xl md:text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">
          Daily Overview
        </h1>
        <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px] mb-3"></div>
        
        <div className='w-full md:grid md:grid-cols-2'>
          
          <div className='flex flex-col md:ml-5 items-center max-w-[1000px]'>
            <p className='w-full text-xl md:text-3xl font-semibold mb-3 rounded-lg px-2  bg-gradient-to-br from-purple-500 via-cyan-500 to-pink-600'>{`Today's Tasks`}</p>
            <AddNewTaskForm />
            <BacklogListShort />
          </div>
          <div className='flex flex-col md:mr-5 items-center max-w-[1000px]'>
            <p className='w-full  text-xl md:text-3xl font-semibold mb-3 rounded-lg px-2  bg-gradient-to-br from-purple-500 via-cyan-500 to-pink-600'>Daily Habits</p>
            <Routines/>
          </div>
        </div>
      </div>
    </main>
  );
}
