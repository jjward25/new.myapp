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

const WEEKLY_TARGETS: Record<string, number> = {
  'Cardio': 3,
  'Chest+Tris': 2,
  'Shoulders': 2,
  'Quads': 2,
  'Hamstrings': 2,
  'Glutes+Hips': 2,
  'Back+Bis': 2,
  'Core': 2,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Cardio': 'bg-rose-600',
  'Chest+Tris': 'bg-blue-600',
  'Shoulders': 'bg-violet-600',
  'Quads': 'bg-amber-600',
  'Hamstrings': 'bg-orange-600',
  'Glutes+Hips': 'bg-pink-600',
  'Back+Bis': 'bg-emerald-600',
  'Core': 'bg-teal-600',
};

export default function WeeklyGoalsSummary() {
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get start of current week (Monday)
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };
  
  const fetchWeeklyWorkouts = useCallback(async () => {
    try {
      const response = await fetch('/api/workouts/simple');
      const data = await response.json();
      const weekStart = getWeekStart();
      const filtered = data.filter((w: Workout) => w.Date >= weekStart);
      setWeeklyWorkouts(filtered);
    } catch (error) {
      console.error('Error fetching weekly workouts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchWeeklyWorkouts();
  }, [fetchWeeklyWorkouts]);
  
  // Calculate counts per category
  const getCounts = () => {
    const counts: Record<string, number> = {};
    Object.keys(WEEKLY_TARGETS).forEach(cat => { counts[cat] = 0; });
    
    weeklyWorkouts.forEach(workout => {
      workout.Exercises?.forEach(ex => {
        if (counts[ex.Category] !== undefined) {
          counts[ex.Category]++;
        }
      });
    });
    
    return counts;
  };
  
  const counts = getCounts();
  
  // Calculate days remaining in week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysRemaining = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <p className="text-slate-400 text-sm text-center">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Weekly Workout Goals</h3>
        <span className="text-xs text-slate-400">{daysRemaining} days left</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(WEEKLY_TARGETS).map(([category, target]) => {
          const current = counts[category] || 0;
          const isComplete = current >= target;
          const percentage = Math.min((current / target) * 100, 100);
          
          return (
            <div 
              key={category}
              className="relative"
            >
              <div className={`text-center p-2 rounded border ${
                isComplete 
                  ? 'bg-teal-900/50 border-teal-600' 
                  : 'bg-slate-900 border-slate-600'
              }`}>
                <p className="text-[10px] text-slate-400 truncate mb-1">{category}</p>
                <p className={`text-lg font-bold ${isComplete ? 'text-teal-400' : 'text-white'}`}>
                  {current}/{target}
                </p>
                {/* Progress bar */}
                <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${CATEGORY_COLORS[category] || 'bg-slate-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

