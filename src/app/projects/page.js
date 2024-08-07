// src/app/milestones/page.js
import { promises as fs } from 'fs';
import path from 'path';
import PrjList from '../../components/projects/PrjList';
import {getCurrentFormattedDate} from '../../utils/Date' 

// Function to read and parse the JSON file


const Milestones = async () => {
  const today = getCurrentFormattedDate();

  return (

    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">

      <h1 className="text-5xl font-semibold bg-clip-text text-transparent bg-cyan-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-0 mb-10 md:mb-14 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat shadow-2xl transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms] text-center">Project Milestones</h1>
      <p className='text-white py-4 mb-14 border-t border-b border-cyan-700 w-full max-w-[750px] text-center'>{getCurrentFormattedDate()}</p>

      <div className="flex flex-col w-full h-full mb-10">

        <div className="flex flex-col w-full h-full m-auto">
            <PrjList />
        </div>

      </div>

    </main>

      
  );
};

export default Milestones;
