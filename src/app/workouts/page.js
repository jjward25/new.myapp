import React from 'react';
import { getToday } from '../../utils/Date';
import { getWorkout } from '../../utils/mongoDB/workoutsCRUD'; // Renamed function to reflect fetching all workouts
import { PastWorkoutWrap } from '@/components/workouts/pastWorkoutWrap';
import NewWorkoutBtn from '@/components/workouts/newWorkout';
import TodaysWorkout from '@/components/workouts/todaysWorkout';

export const revalidate = 60 * 60; // Regenerate the page every hour

export default async function WorkoutHome() {
  // Fetch today's date and all workouts
  const today = await getToday();
  const workouts = await getWorkout(); // Fetch all workouts

  // If no workouts are found, return a message or placeholder component
  if (!workouts || workouts.length === 0) {
    return <div>No workouts found.</div>;
  }

  // Sort workouts by Date in descending order
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">
      <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-cyan-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-2 mb-10 md:mb-16 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat  transition-[background-position_0s_ease] hover:bg-[position:200%_0,0_0] hover:duration-[1500ms] text-center">
        Workout Tracker
      </h1>

      <a
        href="https://www.nsca.com/contentassets/61d813865e264c6e852cadfe247eae52/nsca_training_load_chart.pdf"
        target="_blank"
        className="text-cyan-500 hover:text-cyan-800 cursor-pointer"
      >
        1RM Chart
      </a>

      <div className="bg-black text-white rounded-lg my-8 border-2 border-black drop-shadow-sm flex flex-col p-4 w-full">
        <h3 className="text-sm font-semibold mb-2">
          Program: <em className="not-italic text-cyan-500">Compound-Iso Full Body 2-Day</em>
        </h3>
        <p className="mb-2 text-xs text-neutral-400">
          Compounds start with 2 strength sets at 85% of 1RM then 2 hypertrophy sets at 65%. Isos work at the border, leaning hypertrophy, at 75%. 
        </p>
        <p className="mb-2 text-xs text-neutral-400">
          {`Strength sets are done for max reps, targeting about 2-4 reps per set. The hypertrophy sets for compounds are done as a Myo-Match set (max reps then match that total). Isos are done for 8 reps each set.`}
        </p>
        <p className="mb-2 text-xs text-neutral-400">
          New Maxes for compounds are based on the reps done in the first strength set. New Maxes for isos are based on reps performed in the 3rd set assuming no failed sets. 
        </p>
        <p className="pb-3 mb-4 border-b border-white text-xs text-neutral-400">
          For full marks, work in some military press on Upper Compound days between Incline and BB Row sets and do Pull Ups throughout your Lower Compound days.  Add Bis and Tris when feeling frisky.
        </p>

        {/* Button to trigger today's workout creation */}
        <div className='flex justify-center'>
          <NewWorkoutBtn/>
        </div>

        <div className=''>
          <TodaysWorkout/>
        </div>

        {/* Render all fetched workouts sorted by Date */}
        <div className="workout-list">
          {sortedWorkouts.map((workout) => (
            <PastWorkoutWrap key={workout._id.toString()} workout={workout} />
          ))}
        </div>
      </div>
    </main>
  );
}
