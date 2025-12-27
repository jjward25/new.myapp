"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { triggerAchievementAnimation } from '@/components/animations/GlobalAnimationProvider';

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
  'Chest+Tris': 8,
  'Shoulders': 8,
  'Quads': 8,
  'Hamstrings': 8,
  'Hips': 8,
  'Back+Bis': 8,
  'Core': 8,
};

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

// Miles goal for weekly completion
const MILES_GOAL = 6;

// Lift categories for counting lift sessions
const LIFT_CATEGORIES = ['Chest+Tris', 'Shoulders', 'Quads', 'Hamstrings', 'Hips', 'Back+Bis', 'Core'];

export default function WeeklyGoalsSummary() {
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedCompletion = useRef(false);
  
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
  
  // Get unique week identifier for tracking completion
  const getWeekIdentifier = () => {
    return getWeekStart();
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
  
  // Calculate counts per category (summing sets, not exercise entries)
  const getCounts = () => {
    const counts: Record<string, number> = {};
    Object.keys(WEEKLY_TARGETS).forEach(cat => { counts[cat] = 0; });
    
    weeklyWorkouts.forEach(workout => {
      workout.Exercises?.forEach(ex => {
        if (counts[ex.Category] !== undefined) {
          // Count actual sets, default to 1 if Sets field is missing
          counts[ex.Category] += (ex.Sets || 1);
        }
      });
    });
    
    return counts;
  };
  
  // Calculate total miles for the week
  const getTotalMiles = () => {
    let totalMiles = 0;
    weeklyWorkouts.forEach(workout => {
      workout.Exercises?.forEach(ex => {
        if (ex.Category === 'Cardio' && ex.Miles) {
          totalMiles += ex.Miles;
        }
      });
    });
    return totalMiles;
  };
  
  // Count number of lift sessions (any workout with lift exercises)
  const getLiftSessions = () => {
    let liftSessions = 0;
    weeklyWorkouts.forEach(workout => {
      const hasLift = workout.Exercises?.some(ex => LIFT_CATEGORIES.includes(ex.Category));
      if (hasLift) liftSessions++;
    });
    return liftSessions;
  };
  
  // Count cardio sessions
  const getCardioSessions = () => {
    let cardioSessions = 0;
    weeklyWorkouts.forEach(workout => {
      const hasCardio = workout.Exercises?.some(ex => ex.Category === 'Cardio');
      if (hasCardio) cardioSessions++;
    });
    return cardioSessions;
  };
  
  const counts = getCounts();
  const totalMiles = getTotalMiles();
  const liftSessions = getLiftSessions();
  const cardioSessions = getCardioSessions();
  
  // Check if weekly workout is complete (2 lift, 3 cardio, 6 miles)
  const isWeeklyComplete = liftSessions >= 2 && cardioSessions >= 3 && totalMiles >= MILES_GOAL;
  
  // Check for weekly completion and trigger achievement
  useEffect(() => {
    const checkAndTriggerAchievement = async () => {
      if (isWeeklyComplete && !hasCheckedCompletion.current && !isLoading) {
        hasCheckedCompletion.current = true;
        
        try {
          const response = await fetch('/api/achievements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              pool: 'weeklyWorkout',
              weekIdentifier: getWeekIdentifier()
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            // Only show achievement if this is a new completion (not already completed this week)
            if (!result.alreadyCompleted) {
              triggerAchievementAnimation('💉💪 Iron Throne will be yours - weekly workout complete 💪💉', result.level);
            }
          }
        } catch (error) {
          console.error('Error checking weekly workout achievement:', error);
        }
      }
    };
    
    checkAndTriggerAchievement();
  }, [isWeeklyComplete, isLoading]);
  
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
      
      {/* Weekly completion summary */}
      {isWeeklyComplete && (
        <div className="bg-teal-900/50 border border-teal-600 rounded p-2 mb-3 text-center">
          <span className="text-teal-400 text-xs font-semibold">Week Complete!</span>
        </div>
      )}
      
      {/* Miles progress */}
      <div className="mb-3 p-2 rounded bg-slate-900 border border-slate-600">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-400">Miles This Week</span>
          <span className={`text-sm font-bold ${totalMiles >= MILES_GOAL ? 'text-teal-400' : 'text-white'}`}>
            {totalMiles.toFixed(1)}/{MILES_GOAL}
          </span>
        </div>
        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all bg-rose-600"
            style={{ width: `${Math.min((totalMiles / MILES_GOAL) * 100, 100)}%` }}
          />
        </div>
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

