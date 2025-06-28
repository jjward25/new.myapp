import React from 'react';
import { getToday } from '../../utils/Date';
import { getWorkout } from '../../utils/mongoDB/workoutsCRUD';
import WorkoutTracker from '@/components/workouts/WorkoutTracker';
import WorkoutProgressionChart from '@/components/workouts/WorkoutProgressionChart';
import PastWorkoutsSection from '@/components/workouts/PastWorkoutsSection';


//export const revalidate = 60 * 60; // Regenerate the page every hour

export default async function WorkoutHome() {
  // Fetch today's date and all workouts
  const today = await getToday();
  const workouts = await getWorkout();

  // Sort workouts by Date in descending order
  const sortedWorkouts = workouts ? [...workouts].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()) : [];

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">
      <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-cyan-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-2 mb-10 md:mb-16 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms] text-center">
        Workout Tracker
      </h1>

      <a
        href="https://www.nsca.com/contentassets/61d813865e264c6e852cadfe247eae52/nsca_training_load_chart.pdf"
        target="_blank"
        className="text-cyan-500 hover:text-cyan-800 cursor-pointer mb-6"
      >
        1RM Chart
      </a>

      {/* Workout Progression Chart */}
      <div className='bg-neutral-200 rounded-md border-2 border-black drop-shadow-sm w-full mb-6'>
        <div className="p-4">
          <WorkoutProgressionChart />
        </div>
      </div>

      <div className="bg-black text-white rounded-lg my-8 border-2 border-black drop-shadow-sm flex flex-col p-4 w-full">
        <h3 className="text-sm font-semibold mb-2">
          Program: <em className="not-italic text-cyan-500">Compound-Iso Full Body 4-Day</em>
        </h3>
        <p className="mb-2 text-xs text-neutral-400">
          Day A: Heavy Upper - Focus on compound chest and back movements
        </p>
        <p className="mb-2 text-xs text-neutral-400">
          Day B: Back and Hips - Pulling movements and hip-dominant exercises
        </p>
        <p className="mb-2 text-xs text-neutral-400">
          Day C: Leg Day - Quad-dominant and full-body compound movements
        </p>
        <p className="pb-3 mb-4 border-b border-white text-xs text-neutral-400">
          Day D: Maintenance + Mobility - Recovery and movement quality focus
        </p>

        {/* New Workout Tracker */}
        <WorkoutTracker />

        {/* Past Workouts with Archive */}
        <PastWorkoutsSection workouts={sortedWorkouts} />
      </div>
    </main>
  );
}
