import React from 'react';
import { listWorkoutEntries } from '../../utils/mongoDB/hermesWorkouts';
import WorkoutsClient from '@/components/workouts/WorkoutsClient';

// Force dynamic rendering - don't prerender this page
export const dynamic = 'force-dynamic';

export default async function WorkoutHome() {
  let sessions = [];
  try {
    sessions = await listWorkoutEntries({ sinceDays: 3650 });
  } catch (error) {
    console.error('Error fetching workout data:', error);
  }
  return <WorkoutsClient sessions={sessions} />;
}
