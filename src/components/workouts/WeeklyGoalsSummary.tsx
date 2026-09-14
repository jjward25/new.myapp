"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { triggerAchievementAnimation } from '@/components/animations/GlobalAnimationProvider';
import { getWeekStartEST, getRemainingDaysEST } from '@/utils/dateUtils';

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
  'Cardio': '#21bce3',
  'Chest+Tris': '#712014',
  'Shoulders': '#7c3aed',
  'Quads': '#d97706',
  'Hamstrings': '#ea580c',
  'Hips': '#fb2be9',
  'Back+Bis': '#195c0e',
  'Core': '#3B82F6',
};

// Miles goal for weekly completion
const MILES_GOAL = 3;

// Lift categories for counting lift sessions
const LIFT_CATEGORIES = ['Chest+Tris', 'Shoulders', 'Quads', 'Hamstrings', 'Hips', 'Back+Bis', 'Core'];

export default function WeeklyGoalsSummary() {
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedCompletion = useRef(false);
  
  // Get unique week identifier for tracking completion (uses EST)
  const getWeekIdentifier = () => {
    return getWeekStartEST();
  };
  
  const fetchWeeklyWorkouts = useCallback(async () => {
    try {
      const response = await fetch('/api/workouts/simple');
      const data = await response.json();
      const weekStart = getWeekStartEST();
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
  
  // Check if weekly workout is complete (2 lift, 3 cardio, 3 miles)
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
  
  // Calculate days remaining in week (using EST)
  const daysRemaining = getRemainingDaysEST() - 1; // -1 because getRemainingDaysEST includes today
  
  if (isLoading) {
    return (
      <div className="mc-panel p-4" style={{ background: '#171a1f', borderColor: 'rgba(255,255,255,0.14)' }}>
        <p className="mc-mono text-[11px] text-[#8a919c] text-center">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mc-panel p-4" style={{ background: '#171a1f', borderColor: 'rgba(255,255,255,0.14)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="mc-label">Weekly Workout Goals</span>
        <span className="mc-mono text-[10px] text-[#5b626d]">{daysRemaining} days left</span>
      </div>

      {/* Weekly completion summary */}
      {isWeeklyComplete && (
        <div className="rounded p-2 mb-3 text-center" style={{ background: 'rgba(53,196,139,0.1)', border: '1px solid #35c48b' }}>
          <span className="mc-mono text-[10px] uppercase tracking-widest text-[#35c48b]">Week Complete!</span>
        </div>
      )}

      {/* Miles progress */}
      <div className="mb-3 p-2 rounded bg-[#0c0d10] border border-white/10">
        <div className="flex justify-between items-center mb-1">
          <span className="mc-mono text-[10px] text-[#8a919c]">Miles This Week</span>
          <span className={`mc-mono text-[13px] font-semibold ${totalMiles >= MILES_GOAL ? 'text-[#35c48b]' : 'text-[#e7eaee]'}`}>
            {totalMiles.toFixed(1)}/{MILES_GOAL}
          </span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all bg-[#22d3ee]"
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
              <div
                className="text-center p-2 rounded border"
                style={isComplete
                  ? { background: 'rgba(53,196,139,0.1)', borderColor: '#35c48b' }
                  : { background: '#0c0d10', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <p className="mc-mono text-[9px] text-[#5b626d] truncate mb-1">{category}</p>
                <p className={`text-[15px] font-semibold ${isComplete ? 'text-[#35c48b]' : 'text-[#e7eaee]'}`}>
                  {current}/{target}
                </p>
                {/* Progress bar */}
                <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: CATEGORY_COLORS[category] || '#5b626d'
                    }}
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

