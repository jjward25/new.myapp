"use client";

import React, { useState } from 'react';
import { PastWorkoutWrap } from './pastWorkoutWrap';

interface Set {
  SetNumber: number;
  Reps: number;
  Weight: number;
}

interface Exercise {
  ExerciseType: string;
  Sets: Set[];
}

interface Workout {
  _id: string;
  Date: string;
  Day: string;
  WorkoutName: string;
  Exercises: Record<string, Exercise>;
}

interface PastWorkoutsSectionProps {
  workouts: Workout[];
}

export default function PastWorkoutsSection({ workouts }: PastWorkoutsSectionProps) {
  const [showArchive, setShowArchive] = useState(false);
  const [currentWorkouts, setCurrentWorkouts] = useState(workouts || []);

  const handleDeleteWorkout = (workoutId: string) => {
    setCurrentWorkouts(prev => (prev || []).filter(workout => workout._id !== workoutId));
  };

  if (!currentWorkouts || !Array.isArray(currentWorkouts) || currentWorkouts.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No previous workouts found. Start tracking your first workout above!
      </div>
    );
  }

  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Separate recent workouts (today + last 4) from archive
  const safeWorkouts = currentWorkouts || [];
  const recentWorkouts = safeWorkouts.slice(0, 5); // Today + previous 4
  const archivedWorkouts = safeWorkouts.slice(5);

  return (
    <div className="workout-list mt-8 w-full">
      <h3 className="text-lg font-semibold mb-4">Workout History</h3>
      
      {/* Recent Workouts */}
      <div className="recent-workouts">
        {recentWorkouts.map((workout) => (
          <PastWorkoutWrap 
            key={workout._id} 
            workout={workout} 
            onDelete={handleDeleteWorkout}
          />
        ))}
      </div>

      {/* Archive Section */}
      {archivedWorkouts.length > 0 && (
        <div className="archive-section mt-6">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center justify-between w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium">
              Archive ({archivedWorkouts.length} older workouts)
            </span>
            <span className={`transform transition-transform ${showArchive ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {showArchive && (
            <div className="mt-4 bg-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-4">
                Showing {archivedWorkouts.length} archived workouts
              </div>
              {archivedWorkouts.map((workout) => (
                <PastWorkoutWrap 
                  key={workout._id} 
                  workout={workout} 
                  onDelete={handleDeleteWorkout}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 