// src/app/milestones/page.js
import { promises as fs } from 'fs';
import path from 'path';
import MilestonesPage from './prjCard/MilestonesPage';
import {getCurrentFormattedDate} from '../../components/date' 

// Function to read and parse the JSON file
const fetchMilestonesData = async () => {
  const filePath = path.join(process.cwd(), 'src/utils/jsons/prj_milestones.json');
  const jsonData = await fs.readFile(filePath, 'utf8');
  return JSON.parse(jsonData);
};

const Milestones = async () => {
  const milestones = await fetchMilestonesData();
  const today = getCurrentFormattedDate();

  // Ensure milestones is an array
  if (!Array.isArray(milestones)) {
    throw new Error('Invalid data format');
  }

  return (

    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">

    <h1 className="hover:scale-150 text-5xl font-semibold text-slate-800 mt-2 mb-10 bg-clip-text text-transparent bg-gradient-radial  from-purple-500 via-cyan-500 to-pink-600 drop-shadow-md">Task Backlog</h1>
    <p className='text-white mb-10'>{today}</p>

    <div className="flex flex-col w-full h-full mb-10">

      <div className="flex flex-col w-full m-auto">
          <MilestonesPage milestones={milestones} />
      </div>

    </div>

    </main>

      
  );
};

export default Milestones;
