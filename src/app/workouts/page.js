import React from 'react';
import './baddie.css';
import { getWorkout } from '../../utils/mongoDB/workoutsCRUD';
import { USE_MOCK_WORKOUTS, mockWorkouts } from '../../utils/mockWorkoutData';
import WorkoutsClient from '@/components/workouts/WorkoutsClient';

// Force dynamic rendering - don't prerender this page
export const dynamic = 'force-dynamic';

export default async function WorkoutHome() {
  let workouts = USE_MOCK_WORKOUTS ? mockWorkouts : [];

  try {
    if (!USE_MOCK_WORKOUTS) workouts = await getWorkout();
  } catch (error) {
    console.error('Error fetching workout data:', error);
  }

  const sortedWorkouts = Array.isArray(workouts)
    ? [...workouts].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
    : [];

  return <WorkoutsClient workouts={sortedWorkouts} />;
}
