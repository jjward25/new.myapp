import Daily from './daily/page'
import {getCurrentFormattedDate} from '../components/date' 
import BacklogList from '../components/backlog.js';

export default function Home() {
  const today = getCurrentFormattedDate();

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">

      <h1 className="hover:animate-spin text-5xl font-semibold text-slate-800 mt-2 mb-10 bg-clip-text text-transparent bg-gradient-radial  from-purple-500 via-cyan-500 to-pink-600 drop-shadow-md">{`Joe's Life`}</h1>
      <p className='text-white mb-10'>{today}</p>
      
      <div className="flex flex-col w-full h-full mb-10">
        <h1 className="text-xl md:text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">Daily Overview</h1>
        <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px] mb-3"></div>
        <Daily/>
      </div>
      <BacklogList/>

    </main>
  );
}
