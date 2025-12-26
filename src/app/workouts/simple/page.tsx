"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface Exercise {
  _id?: string;
  Category: string;
  ExerciseName?: string;
  ExerciseType?: string;
  Intensity?: string;
  Miles?: number;
  Time?: number;
  Sets?: number;
  Reps?: number;
  Weight?: number;
}

interface Workout {
  _id?: string;
  Type: string;
  Date: string;
  Exercises: Exercise[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Cardio': 'bg-rose-600',
  'Chest+Tris': 'bg-blue-600',
  'Shoulders': 'bg-violet-600',
  'Quads': 'bg-amber-600',
  'Hamstrings': 'bg-orange-600',
  'Hips': 'bg-pink-600',
  'Back+Bis': 'bg-emerald-600',
  'Core': 'bg-teal-600',
};

export default function SimpleWorkoutHistory() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const fetchWorkouts = useCallback(async () => {
    try {
      const response = await fetch('/api/workouts/simple');
      const data = await response.json();
      // Sort by date descending
      const sorted = data.sort((a: Workout, b: Workout) => 
        new Date(b.Date).getTime() - new Date(a.Date).getTime()
      );
      setWorkouts(sorted);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);
  
  const formatExerciseDisplay = (exercise: Exercise) => {
    const parts = [];
    
    if (exercise.Category === 'Cardio') {
      parts.push(exercise.ExerciseType);
      if (exercise.Miles) parts.push(`${exercise.Miles} mi`);
      if (exercise.Time) parts.push(`${exercise.Time} min`);
    } else {
      parts.push(exercise.ExerciseName);
      if (exercise.Intensity) parts.push(`(${exercise.Intensity})`);
      if (exercise.Sets) parts.push(`${exercise.Sets} sets`);
      if (exercise.Reps) parts.push(`${exercise.Reps} reps`);
      if (exercise.Weight) parts.push(`${exercise.Weight} lbs`);
      if (exercise.Time) parts.push(`${exercise.Time} min`);
    }
    
    return parts.join(' • ');
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const allCategories = ['all', ...Object.keys(CATEGORY_COLORS)];
  
  const filteredWorkouts = workouts.map(workout => ({
    ...workout,
    Exercises: filterCategory === 'all' 
      ? workout.Exercises 
      : workout.Exercises.filter(ex => ex.Category === filterCategory)
  })).filter(workout => workout.Exercises.length > 0);
  
  // Calculate stats
  const totalWorkouts = workouts.length;
  const totalExercises = workouts.reduce((sum, w) => sum + w.Exercises.length, 0);
  const totalCardioMiles = workouts.reduce((sum, w) => 
    sum + w.Exercises.filter(e => e.Category === 'Cardio').reduce((m, e) => m + (e.Miles || 0), 0)
  , 0);
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-12 w-full h-full">
      <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-teal-500 hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 mt-6 md:mt-2 mb-6 text-center">
        Workout History
      </h1>
      
      {/* Back link */}
      <a 
        href="/" 
        className="text-teal-400 hover:text-teal-300 mb-6 text-sm"
      >
        ← Back to Home
      </a>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mb-6">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-white">{totalWorkouts}</p>
          <p className="text-xs text-slate-400">Workouts</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-white">{totalExercises}</p>
          <p className="text-xs text-slate-400">Exercises</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
          <p className="text-2xl font-bold text-white">{totalCardioMiles.toFixed(1)}</p>
          <p className="text-xs text-slate-400">Miles Run</p>
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-teal-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>
      
      {/* Workouts List */}
      <div className="w-full max-w-2xl space-y-4">
        {isLoading ? (
          <p className="text-slate-400 text-center">Loading...</p>
        ) : filteredWorkouts.length === 0 ? (
          <p className="text-slate-400 text-center">No workouts found.</p>
        ) : (
          filteredWorkouts.map((workout) => (
            <div 
              key={workout._id || workout.Date}
              className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
            >
              <div className="bg-slate-700/50 px-4 py-2 border-b border-slate-700">
                <p className="text-sm font-medium text-white">{formatDate(workout.Date)}</p>
                <p className="text-xs text-slate-400">{workout.Exercises.length} exercise{workout.Exercises.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="p-3 space-y-2">
                {workout.Exercises.map((exercise, index) => (
                  <div 
                    key={exercise._id || index}
                    className="flex items-start gap-3 bg-slate-900/50 rounded p-2"
                  >
                    <span className={`${CATEGORY_COLORS[exercise.Category] || 'bg-slate-600'} text-white text-[10px] font-medium px-2 py-0.5 rounded`}>
                      {exercise.Category}
                    </span>
                    <p className="text-sm text-slate-200 flex-1">{formatExerciseDisplay(exercise)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

