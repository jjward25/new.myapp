"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { triggerAchievementAnimation, triggerParticleAnimation } from '@/components/animations/GlobalAnimationProvider';
import { refreshKPIs } from '@/components/kpis/KPIDashboard';
import { getTodayEST, getWeekStartEST } from '@/utils/dateUtils';

interface Exercise {
  _id?: string;
  Category: string;
  ExerciseName?: string;
  ExerciseType?: string; // For Cardio: Jog/Sprint
  Intensity?: string; // Heavy/Light
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

const CATEGORIES = [
  { name: 'Cardio', selector: 'type', exercises: [], target: 3 },
  { name: 'Chest+Tris', selector: 'intensity', exercises: ['Push ups', 'Flies', 'Bench', 'Dips'], target: 8 },
  { name: 'Shoulders', selector: 'intensity', exercises: ['DB Raises', 'Military Press', 'Face Pulls', 'Hangs', 'Pullover'], target: 8 },
  { name: 'Quads', selector: 'intensity', exercises: ['Sissy Squats', 'Leg Extensions', 'Squats'], target: 8 },
  { name: 'Hamstrings', selector: 'intensity', exercises: ['Jeffersons', 'RDLs', 'Hamstring Curls', 'Squats'], target: 8 },
  { name: 'Hips', selector: 'intensity', exercises: ['Thrusts', 'Cossack Squats', 'Leg Raises', 'L-Sit'], target: 8 },
  { name: 'Back+Bis', selector: 'intensity', exercises: ['Curls', 'Pull-ups', 'Rows'], target: 8 },
  { name: 'Core', selector: 'none', exercises: ['Plank', 'Sit-ups'], target: 8 },
  { name: '1RM', selector: '1rm', exercises: ['Bench', 'Squat', 'Deadlift', 'Pull-Ups', '5k'], target: 0 },
];

interface SimpleWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleWorkoutModal({ isOpen, onClose }: SimpleWorkoutModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [todaysWorkout, setTodaysWorkout] = useState<Workout | null>(null);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [exerciseType, setExerciseType] = useState('Jog'); // Cardio
  const [intensity, setIntensity] = useState('Heavy'); // Other categories
  const [exerciseName, setExerciseName] = useState('');
  const [miles, setMiles] = useState<number | ''>('');
  const [time, setTime] = useState<number | ''>('');
  const [sets, setSets] = useState<number | ''>('');
  const [reps, setReps] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  
  // 1RM form state
  const [oneRmExercise, setOneRmExercise] = useState('Bench');
  const [oneRmValue, setOneRmValue] = useState<number | ''>('');
  
  
  // Use EST timezone for consistent date handling
  const today = getTodayEST();
  
  // Calculate weekly counts per category
  const getWeeklyCounts = () => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach(cat => { counts[cat.name] = 0; });
    
    weeklyWorkouts.forEach(workout => {
      workout.Exercises?.forEach(ex => {
        if (counts[ex.Category] !== undefined) {
          counts[ex.Category]++;
        }
      });
    });
    
    return counts;
  };
  
  const fetchTodaysWorkout = useCallback(async () => {
    try {
      const response = await fetch(`/api/workouts/simple?date=${today}`);
      const data = await response.json();
      setTodaysWorkout(data);
    } catch (error) {
      console.error('Error fetching today\'s workout:', error);
    }
  }, [today]);
  
  const fetchWeeklyWorkouts = useCallback(async () => {
    try {
      const response = await fetch('/api/workouts/simple');
      const data = await response.json();
      const weekStart = getWeekStartEST();
      const filtered = data.filter((w: Workout) => w.Date >= weekStart);
      setWeeklyWorkouts(filtered);
    } catch (error) {
      console.error('Error fetching weekly workouts:', error);
    }
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      fetchTodaysWorkout();
      fetchWeeklyWorkouts();
    }
  }, [isOpen, fetchTodaysWorkout, fetchWeeklyWorkouts]);
  
  useEffect(() => {
    // Reset exercise name when category changes
    if (selectedCategory.exercises.length > 0) {
      setExerciseName(selectedCategory.exercises[0]);
    } else {
      setExerciseName('');
    }
  }, [selectedCategory]);
  
  const resetForm = () => {
    setExerciseType('Jog');
    setIntensity('Heavy');
    setMiles('');
    setTime('');
    setSets('');
    setReps('');
    setWeight('');
    setOneRmValue('');
    if (selectedCategory.name === '1RM') {
      setOneRmExercise('Bench');
    } else if (selectedCategory.exercises.length > 0) {
      setExerciseName(selectedCategory.exercises[0]);
    }
  };
  
  
  // Check if 1RM is a new personal best
  const checkFor1RMPersonalBest = (exerciseName: string, newValue: number): boolean => {
    // Get all previous 1RM values for this exercise
    const previous1RMs: number[] = [];
    
    weeklyWorkouts.forEach(workout => {
      workout.Exercises?.forEach(ex => {
        if (ex.Category === '1RM' && ex.ExerciseName === exerciseName) {
          const value = exerciseName === '5k' ? ex.Time : ex.Weight;
          if (value) previous1RMs.push(value);
        }
      });
    });
    
    // For 5k, lower is better; for others, higher is better
    if (exerciseName === '5k') {
      return previous1RMs.length === 0 || newValue < Math.min(...previous1RMs);
    } else {
      return previous1RMs.length === 0 || newValue > Math.max(...previous1RMs);
    }
  };
  
  
  const handleAddExercise = async () => {
    setIsLoading(true);
    
    const exercise: Exercise = {
      Category: selectedCategory.name,
    };
    
    if (selectedCategory.name === 'Cardio') {
      exercise.ExerciseType = exerciseType;
      if (miles) exercise.Miles = Number(miles);
      if (time) exercise.Time = Number(time);
    } else if (selectedCategory.name === '1RM') {
      exercise.ExerciseName = oneRmExercise;
      if (oneRmExercise === '5k') {
        exercise.Time = Number(oneRmValue);
      } else {
        exercise.Weight = Number(oneRmValue);
      }
    } else {
      exercise.ExerciseName = exerciseName;
      if (selectedCategory.selector === 'intensity') {
        exercise.Intensity = intensity;
      }
    }
    
    // Universal optional fields (not for 1RM)
    if (selectedCategory.name !== '1RM') {
      if (sets) exercise.Sets = Number(sets);
      if (reps) exercise.Reps = Number(reps);
      if (weight) exercise.Weight = Number(weight);
      if (time && selectedCategory.name !== 'Cardio') exercise.Time = Number(time);
    }
    
    try {
      const response = await fetch('/api/workouts/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, exercise }),
      });
      
      if (response.ok) {
        // Check for 1RM personal best BEFORE fetching updated data
        if (selectedCategory.name === '1RM' && oneRmValue) {
          const isNewPB = checkFor1RMPersonalBest(oneRmExercise, Number(oneRmValue));
          if (isNewPB) {
            // Increment workouts level for 1RM personal best
            try {
              const achieveResponse = await fetch('/api/achievements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pool: 'workouts' }),
              });
              if (achieveResponse.ok) {
                const { level } = await achieveResponse.json();
                triggerAchievementAnimation(`💉💪 New 1 Rep Max! 💪💉`, level);
              } else {
                // Still show achievement even if level fetch fails
                triggerAchievementAnimation(`💉💪 New 1 Rep Max! 💪💉`);
              }
            } catch (achieveError) {
              console.error('Error incrementing achievement:', achieveError);
              triggerAchievementAnimation(`💉💪 New 1 Rep Max! 💪💉`);
            }
          }
        } else {
          // Trigger particle explosion for regular exercises
          triggerParticleAnimation();
        }
        
        await fetchTodaysWorkout();
        await fetchWeeklyWorkouts();
        resetForm();
        
        // Refresh KPI dashboard to show updated miles
        refreshKPIs();
      }
    } catch (error) {
      console.error('Error adding exercise:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      const response = await fetch('/api/workouts/simple', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, exerciseId }),
      });
      
      if (response.ok) {
        await fetchTodaysWorkout();
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };
  
  const formatExerciseDisplay = (exercise: Exercise) => {
    const parts = [];
    
    if (exercise.Category === 'Cardio') {
      parts.push(exercise.ExerciseType);
      if (exercise.Miles) parts.push(`${exercise.Miles} mi`);
      if (exercise.Time) parts.push(`${exercise.Time} min`);
    } else if (exercise.Category === '1RM') {
      parts.push(exercise.ExerciseName);
      if (exercise.ExerciseName === '5k') {
        if (exercise.Time) parts.push(`${exercise.Time} min`);
      } else {
        if (exercise.Weight) parts.push(`${exercise.Weight} lbs`);
      }
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
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Log Workout</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 p-3 border-b border-slate-700 bg-slate-800/50">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                selectedCategory.name === cat.name
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        {/* Form */}
        <div className="p-4 border-b border-slate-700 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Category-specific inputs */}
            {selectedCategory.name === 'Cardio' ? (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="Jog">Jog</option>
                    <option value="Sprint">Sprint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Miles</label>
                  <input
                    type="number"
                    step="0.1"
                    value={miles}
                    onChange={(e) => setMiles(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Time (min)</label>
                  <input
                    type="number"
                    value={time}
                    onChange={(e) => setTime(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              </>
            ) : selectedCategory.name === '1RM' ? (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lift</label>
                  <select
                    value={oneRmExercise}
                    onChange={(e) => setOneRmExercise(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="Bench">Bench</option>
                    <option value="Squat">Squat</option>
                    <option value="Deadlift">Deadlift</option>
                    <option value="Pull-Ups">Pull-Ups</option>
                    <option value="5k">5k</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {oneRmExercise === '5k' ? 'Time (min)' : 'Weight (lbs)'}
                  </label>
                  <input
                    type="number"
                    step={oneRmExercise === '5k' ? '0.1' : '1'}
                    value={oneRmValue}
                    onChange={(e) => setOneRmValue(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Exercise selector */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Exercise</label>
                  <select
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  >
                    {selectedCategory.exercises.map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>
                
                {/* Intensity selector (if applicable) */}
                {selectedCategory.selector === 'intensity' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Intensity</label>
                    <select
                      value={intensity}
                      onChange={(e) => setIntensity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                    >
                      <option value="Heavy">Heavy</option>
                      <option value="Light">Light</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Universal optional inputs (not for 1RM) */}
          {selectedCategory.name !== '1RM' && (
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Sets</label>
                <input
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Reps</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>
              {selectedCategory.name !== 'Cardio' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Time (min)</label>
                  <input
                    type="number"
                    value={time}
                    onChange={(e) => setTime(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleAddExercise}
            disabled={isLoading || (selectedCategory.name === '1RM' && !oneRmValue)}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {isLoading ? 'Adding...' : selectedCategory.name === '1RM' ? 'Log 1RM' : 'Add Exercise'}
          </button>
        </div>
        
        {/* Weekly Goals */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/30">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Weekly Goals</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {CATEGORIES.filter(cat => cat.target > 0).map((cat) => {
              const counts = getWeeklyCounts();
              const current = counts[cat.name] || 0;
              const isComplete = current >= cat.target;
              return (
                <div 
                  key={cat.name}
                  className={`text-center p-2 rounded border ${
                    isComplete 
                      ? 'bg-teal-900/50 border-teal-600' 
                      : 'bg-slate-800 border-slate-600'
                  }`}
                >
                  <p className="text-[10px] text-slate-400 truncate">{cat.name}</p>
                  <p className={`text-sm font-bold ${isComplete ? 'text-teal-400' : 'text-white'}`}>
                    {current}/{cat.target}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Today's Exercises */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Today&apos;s Exercises</h3>
            <a 
              href="/workouts/simple" 
              className="text-xs text-teal-400 hover:text-teal-300"
            >
              View History
            </a>
          </div>
          
          {!todaysWorkout || todaysWorkout.Exercises?.length === 0 ? (
            <p className="text-slate-500 text-sm">No exercises logged yet today.</p>
          ) : (
            <div className="space-y-2">
              {todaysWorkout.Exercises?.map((exercise, index) => (
                <div 
                  key={exercise._id || index}
                  className="flex items-center justify-between bg-slate-800 rounded-lg p-3 border border-slate-700"
                >
                  <div>
                    <span className="text-xs font-medium text-teal-400">{exercise.Category}</span>
                    <p className="text-sm text-white">{formatExerciseDisplay(exercise)}</p>
                  </div>
                  <button
                    onClick={() => exercise._id && handleDeleteExercise(exercise._id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

