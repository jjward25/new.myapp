"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface Set {
  SetNumber: number;
  Reps: number;
  Weight: number;
}

interface Exercise {
  ExerciseType: string;
  Sets: Set[];
}

interface TemplateExercise {
  Superset: string;
  Sets: number;
  Reps: string;
  Group: string;
  Emphasis: string;
  Time: string;
  Unit?: string;
}

interface WorkoutTemplate {
  Name: string;
  Exercises: Record<string, TemplateExercise>;
}

interface Templates {
  Day_A: WorkoutTemplate;
  Day_B: WorkoutTemplate;
  Day_C: WorkoutTemplate;
  Day_D: WorkoutTemplate;
}

interface Workout {
  _id?: string;
  Date: string;
  Day: string;
  WorkoutName: string;
  Exercises: Record<string, Exercise>;
}

interface ExerciseGroup {
  exerciseName: string;
  exercise: Exercise;
  templateExercise: TemplateExercise;
}

interface ChartDataPoint {
  date: string;
  totalWeight: number;
}

export default function WorkoutTracker() {
  const [templates, setTemplates] = useState<Templates | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);
  const [existingWorkout, setExistingWorkout] = useState<Workout | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  
  // Accordion state - exercises default to closed (true = collapsed)
  const [collapsedSessions, setCollapsedSessions] = useState<Record<string, boolean>>({});
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/workouts/templates');
      const data = await response.json();
      if (data.Templates) {
        setTemplates(data.Templates);
        setAvailableExercises(getAllExercises(data.Templates));
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  const fetchAllWorkouts = useCallback(async () => {
    try {
      const response = await fetch('/api/workouts');
      const data = await response.json();
      if (Array.isArray(data)) {
        const sortedWorkouts = data.sort((a: Workout, b: Workout) => 
          new Date(a.Date).getTime() - new Date(b.Date).getTime()
        );
        setAllWorkouts(sortedWorkouts);
      }
    } catch (error) {
      console.error('Error fetching all workouts:', error);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchAllWorkouts();
  }, [fetchTemplates, fetchAllWorkouts]);

  const checkForExistingWorkout = async (day: string, date: string) => {
    try {
      const response = await fetch('/api/workouts');
      const workouts = await response.json();
      
      if (Array.isArray(workouts)) {
        const todaysWorkout = workouts.find(w => w.Date === date && w.Day === day);
        return todaysWorkout || null;
      }
      return null;
    } catch (error) {
      console.error('Error checking for existing workout:', error);
      return null;
    }
  };

  const getAllExercises = (templates: Templates): string[] => {
    const exercises = new Set<string>();
    Object.values(templates).forEach(template => {
      Object.keys(template.Exercises).forEach(exercise => {
        exercises.add(exercise);
      });
    });
    return Array.from(exercises);
  };

  const handleDaySelect = async (day: string) => {
    if (day === 'Custom') {
      setIsCustom(true);
      setSelectedDay('Custom');
      setExistingWorkout(null);
      setIsEditing(false);
      initializeCustomWorkout();
    } else {
      setIsCustom(false);
      setSelectedDay(day);
      
      // Check for existing workout for today
      const today = new Date().toISOString().split('T')[0];
      const existing = await checkForExistingWorkout(day, today);
      
      if (existing) {
        setExistingWorkout(existing);
        setIsEditing(true);
        loadExistingWorkout(existing, day);
      } else {
        setExistingWorkout(null);
        setIsEditing(false);
        initializeWorkout(day);
      }
    }
    
    // Reset session accordion states, but keep exercises collapsed by default
    setCollapsedSessions({});
    // Initialize all exercises as collapsed (closed)
    if (day !== 'Custom' && templates) {
      const dayKey = `Day_${day}` as keyof Templates;
      const template = templates[dayKey];
      if (template) {
        const exerciseCollapsedState: Record<string, boolean> = {};
        Object.keys(template.Exercises).forEach(exerciseName => {
          exerciseCollapsedState[exerciseName] = true; // Default to closed
        });
        setCollapsedExercises(exerciseCollapsedState);
      }
    }
  };

  const loadExistingWorkout = (existingWorkout: Workout, day: string) => {
    if (!templates) return;
    
    const dayKey = `Day_${day}` as keyof Templates;
    const template = templates[dayKey];
    
    if (!template) return;

    // Start with the existing workout
    const workout: Workout = {
      ...existingWorkout,
      Exercises: { ...existingWorkout.Exercises }
    };

    // Add any missing exercises from the template (with empty sets)
    Object.keys(template.Exercises).forEach(exerciseName => {
      if (!workout.Exercises[exerciseName]) {
        const templateExercise = template.Exercises[exerciseName];
        workout.Exercises[exerciseName] = {
          ExerciseType: templateExercise.Group === 'Chest' || 
                       templateExercise.Group === 'Back' || 
                       templateExercise.Group === 'Shoulders' ? 'Compound' : 'Isolation',
          Sets: []
        };
      }
    });

    setCurrentWorkout(workout);
  };

  const initializeWorkout = (day: string) => {
    if (!templates) return;
    
    const dayKey = `Day_${day}` as keyof Templates;
    const template = templates[dayKey];
    
    if (!template) return;

    const workout: Workout = {
      Date: new Date().toISOString().split('T')[0],
      Day: day,
      WorkoutName: template.Name,
      Exercises: {}
    };

    // Initialize exercises with empty sets
    Object.keys(template.Exercises).forEach(exerciseName => {
      const templateExercise = template.Exercises[exerciseName];
      workout.Exercises[exerciseName] = {
        ExerciseType: templateExercise.Group === 'Chest' || 
                     templateExercise.Group === 'Back' || 
                     templateExercise.Group === 'Shoulders' ? 'Compound' : 'Isolation',
        Sets: []
      };
    });

    setCurrentWorkout(workout);
  };

  const initializeCustomWorkout = () => {
    const workout: Workout = {
      Date: new Date().toISOString().split('T')[0],
      Day: 'Custom',
      WorkoutName: 'Custom Workout',
      Exercises: {}
    };
    setCurrentWorkout(workout);
  };

  const addSet = (exerciseName: string, reps: number, weight: number) => {
    if (!currentWorkout) return;

    const exercise = currentWorkout.Exercises[exerciseName];
    const newSetNumber = exercise.Sets.length + 1;
    
    const newSet: Set = {
      SetNumber: newSetNumber,
      Reps: reps,
      Weight: weight
    };

    setCurrentWorkout({
      ...currentWorkout,
      Exercises: {
        ...currentWorkout.Exercises,
        [exerciseName]: {
          ...exercise,
          Sets: [...exercise.Sets, newSet]
        }
      }
    });
  };

  const editSet = (exerciseName: string, setIndex: number, reps: number, weight: number) => {
    if (!currentWorkout) return;

    const exercise = currentWorkout.Exercises[exerciseName];
    const updatedSets = [...exercise.Sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      Reps: reps,
      Weight: weight
    };

    setCurrentWorkout({
      ...currentWorkout,
      Exercises: {
        ...currentWorkout.Exercises,
        [exerciseName]: {
          ...exercise,
          Sets: updatedSets
        }
      }
    });
  };

  const deleteSet = (exerciseName: string, setIndex: number) => {
    if (!currentWorkout) return;

    const exercise = currentWorkout.Exercises[exerciseName];
    const updatedSets = exercise.Sets.filter((_, index) => index !== setIndex);
    
    // Renumber the sets
    const renumberedSets = updatedSets.map((set, index) => ({
      ...set,
      SetNumber: index + 1
    }));

    setCurrentWorkout({
      ...currentWorkout,
      Exercises: {
        ...currentWorkout.Exercises,
        [exerciseName]: {
          ...exercise,
          Sets: renumberedSets
        }
      }
    });
  };

  const addCustomExercise = (exerciseName: string) => {
    if (!currentWorkout || currentWorkout.Exercises[exerciseName]) return;

    setCurrentWorkout({
      ...currentWorkout,
      Exercises: {
        ...currentWorkout.Exercises,
        [exerciseName]: {
          ExerciseType: 'Custom',
          Sets: []
        }
      }
    });
  };

  const saveWorkout = async () => {
    if (!currentWorkout) return;

    try {
      const response = await fetch('/api/workouts', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEditing ? 
          { id: existingWorkout?._id, updatedItem: currentWorkout } : 
          currentWorkout
        ),
      });

      if (response.ok) {
        alert(isEditing ? 'Workout updated successfully!' : 'Workout saved successfully!');
        if (!isEditing) {
          setExistingWorkout(currentWorkout);
          setIsEditing(true);
        }
        // Refresh workout history
        fetchAllWorkouts();
      } else {
        alert('Error saving workout');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Error saving workout');
    }
  };

  // Get last workout data for an exercise
  const getLastWorkoutData = (exerciseName: string): { workout: Workout; exercise: Exercise } | null => {
    const today = new Date().toISOString().split('T')[0];
    
    // Find the most recent workout (excluding today) that contains this exercise
    for (let i = allWorkouts.length - 1; i >= 0; i--) {
      const workout = allWorkouts[i];
      if (workout.Date !== today && workout.Exercises[exerciseName] && workout.Exercises[exerciseName].Sets.length > 0) {
        return {
          workout,
          exercise: workout.Exercises[exerciseName]
        };
      }
    }
    return null;
  };

  // Get trend data for an exercise
  const getTrendData = (exerciseName: string): ChartDataPoint[] => {
    const exerciseWorkouts = allWorkouts.filter(workout => 
      workout.Exercises[exerciseName] && workout.Exercises[exerciseName].Sets.length > 0
    );

    return exerciseWorkouts.map(workout => ({
      date: workout.Date,
      totalWeight: workout.Exercises[exerciseName].Sets.reduce((total, set) => total + (set.Reps * set.Weight), 0)
    }));
  };

  // Group exercises by session time with proper ordering
  const groupExercisesBySession = (): Record<string, ExerciseGroup[]> => {
    if (!currentWorkout || !templates || isCustom) return {};

    const dayKey = `Day_${selectedDay}` as keyof Templates;
    const template = templates[dayKey];
    if (!template) return {};

    const sessions: Record<string, ExerciseGroup[]> = {};

    Object.entries(currentWorkout.Exercises).forEach(([exerciseName, exercise]) => {
      const templateExercise = template.Exercises[exerciseName];
      if (templateExercise) {
        const sessionTime = templateExercise.Time;
        if (!sessions[sessionTime]) {
          sessions[sessionTime] = [];
        }
        sessions[sessionTime].push({
          exerciseName,
          exercise,
          templateExercise
        });
      }
    });

    return sessions;
  };

  // Define session order for consistent display
  const getSessionOrder = () => {
    return ['Morning', 'Evening', 'All Day', 'Warmup'];
  };

  // Get session display info
  const getSessionDisplayInfo = (sessionTime: string) => {
    const sessionInfo = {
      'Morning': { 
        emoji: '🌅', 
        color: 'text-orange-400',
        bgColor: 'bg-orange-900/20',
        borderColor: 'border-orange-500'
      },
      'Evening': { 
        emoji: '🌙', 
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        borderColor: 'border-blue-500'
      },
      'All Day': { 
        emoji: '🔄', 
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-500'
      },
      'Warmup': { 
        emoji: '🔥', 
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-500'
      }
    };
    
    return sessionInfo[sessionTime as keyof typeof sessionInfo] || {
      emoji: '💪',
      color: 'text-gray-400',
      bgColor: 'bg-gray-900/20',
      borderColor: 'border-gray-500'
    };
  };

  // Accordion toggle functions
  const toggleSession = (sessionTime: string) => {
    setCollapsedSessions(prev => ({
      ...prev,
      [sessionTime]: !prev[sessionTime]
    }));
  };

  const toggleExercise = (exerciseName: string) => {
    setCollapsedExercises(prev => ({
      ...prev,
      [exerciseName]: !prev[exerciseName]
    }));
  };

  if (!templates) {
    return <div className="text-white">Loading templates...</div>;
  }

  const exerciseGroups = groupExercisesBySession();
  const sessionOrder = getSessionOrder();
  const orderedSessions = sessionOrder.filter(session => exerciseGroups[session]);

  return (
    <div className="text-white p-4">
      <h2 className="text-2xl font-bold mb-4">Workout Tracker</h2>
      
      {/* Day Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Workout Day:</label>
        <select 
          value={selectedDay} 
          onChange={(e) => handleDaySelect(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded p-2"
        >
          <option value="">Choose a day...</option>
          <option value="A">Day A - {templates.Day_A.Name}</option>
          <option value="B">Day B - {templates.Day_B.Name}</option>
          <option value="C">Day C - {templates.Day_C.Name}</option>
          <option value="D">Day D - {templates.Day_D.Name}</option>
          <option value="Custom">Custom Workout</option>
        </select>
      </div>

      {/* Workout Status */}
      {selectedDay && !isCustom && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <p className="text-sm">
            {isEditing ? (
              <span className="text-yellow-400">
                📝 <strong>Continuing workout</strong> - You can add more exercises or complete remaining sessions
              </span>
            ) : (
              <span className="text-green-400">
                ✨ <strong>Starting new workout</strong> - Complete exercises as you go and save your progress
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            💡 Tip: You can save your workout anytime and come back later to complete remaining exercises
          </p>
        </div>
      )}

      {/* Workout Display */}
      {currentWorkout && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-xl font-semibold mb-6">
            {currentWorkout.WorkoutName}
            {isEditing && <span className="text-sm text-yellow-400 ml-2">(In Progress)</span>}
          </h3>
          
          {/* Render exercises grouped by session */}
          {isCustom ? (
            // Custom workout - no session grouping
            <div>
              <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-600">
                Custom Exercises
              </h4>
              {Object.keys(currentWorkout.Exercises).map(exerciseName => (
                <ExerciseCard
                  key={exerciseName}
                  exerciseName={exerciseName}
                  exercise={currentWorkout.Exercises[exerciseName]}
                  templateExercise={null}
                  isCollapsed={collapsedExercises[exerciseName] || true}
                  onToggleCollapse={() => toggleExercise(exerciseName)}
                  lastWorkoutData={null}
                  trendData={[]}
                  onAddSet={(reps, weight) => addSet(exerciseName, reps, weight)}
                  onEditSet={(setIndex, reps, weight) => editSet(exerciseName, setIndex, reps, weight)}
                  onDeleteSet={(setIndex) => deleteSet(exerciseName, setIndex)}
                />
              ))}
            </div>
          ) : (
            // Template workout - grouped by sessions with accordions
            <div className="space-y-6">
              {orderedSessions.map((sessionTime) => {
                const exercises = exerciseGroups[sessionTime];
                const sessionInfo = getSessionDisplayInfo(sessionTime);
                const isSessionCollapsed = collapsedSessions[sessionTime] || false;
                
                return (
                  <div key={sessionTime} className={`border-2 ${sessionInfo.borderColor} ${sessionInfo.bgColor} rounded-lg overflow-hidden`}>
                    {/* Session Header - Clickable */}
                    <div 
                      className={`p-4 cursor-pointer hover:bg-black/10 transition-colors border-b ${sessionInfo.borderColor}`}
                      onClick={() => toggleSession(sessionTime)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xl font-bold ${sessionInfo.color} flex items-center gap-2`}>
                          <span className="text-2xl">{sessionInfo.emoji}</span>
                          {sessionTime} Session
                          <span className="text-sm font-normal text-gray-400">
                            ({exercises.length} exercise{exercises.length !== 1 ? 's' : ''})
                          </span>
                        </h4>
                        <div className={`transform transition-transform duration-200 ${isSessionCollapsed ? 'rotate-0' : 'rotate-90'}`}>
                          <span className="text-2xl text-gray-400">▶</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Session Content - Collapsible */}
                    <div className={`transition-all duration-300 ease-in-out ${isSessionCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'} overflow-hidden`}>
                      <div className="p-4 space-y-4">
                        {exercises.map(({ exerciseName, exercise, templateExercise }) => (
                          <ExerciseCard
                            key={exerciseName}
                            exerciseName={exerciseName}
                            exercise={exercise}
                            templateExercise={templateExercise}
                            isCollapsed={collapsedExercises[exerciseName] !== false} // Default to true (closed)
                            onToggleCollapse={() => toggleExercise(exerciseName)}
                            lastWorkoutData={getLastWorkoutData(exerciseName)}
                            trendData={getTrendData(exerciseName)}
                            onAddSet={(reps, weight) => addSet(exerciseName, reps, weight)}
                            onEditSet={(setIndex, reps, weight) => editSet(exerciseName, setIndex, reps, weight)}
                            onDeleteSet={(setIndex) => deleteSet(exerciseName, setIndex)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Exercise Addition */}
          {isCustom && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold mb-3">Add Exercise</h4>
              <select 
                onChange={(e) => e.target.value && addCustomExercise(e.target.value)}
                className="bg-gray-600 text-white border border-gray-500 rounded p-2 w-full"
              >
                <option value="">Select an exercise...</option>
                {availableExercises.map(exercise => (
                  <option key={exercise} value={exercise}>{exercise}</option>
                ))}
              </select>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 flex justify-center">
            <button 
              onClick={saveWorkout}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {isEditing ? '💾 Update Workout' : '💾 Save Workout'}
            </button>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-2">
            Your progress is automatically saved. You can continue this workout later!
          </p>
        </div>
      )}
    </div>
  );
}

// ExerciseCard component with accordion functionality, last workout data, and trend chart
interface ExerciseCardProps {
  exerciseName: string;
  exercise: Exercise;
  templateExercise: TemplateExercise | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  lastWorkoutData: { workout: Workout; exercise: Exercise } | null;
  trendData: ChartDataPoint[];
  onAddSet: (reps: number, weight: number) => void;
  onEditSet: (setIndex: number, reps: number, weight: number) => void;
  onDeleteSet: (setIndex: number) => void;
}

function ExerciseCard({ 
  exerciseName, 
  exercise, 
  templateExercise, 
  isCollapsed, 
  onToggleCollapse, 
  lastWorkoutData,
  trendData,
  onAddSet, 
  onEditSet, 
  onDeleteSet 
}: ExerciseCardProps) {
  const [newReps, setNewReps] = useState<number>(0);
  const [newWeight, setNewWeight] = useState<number>(0);
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [editReps, setEditReps] = useState<number>(0);
  const [editWeight, setEditWeight] = useState<number>(0);

  const handleAddSet = () => {
    if (newReps > 0) {
      onAddSet(newReps, newWeight);
      setNewReps(0);
      setNewWeight(0);
    }
  };

  const startEditingSet = (setIndex: number, currentReps: number, currentWeight: number) => {
    setEditingSetIndex(setIndex);
    setEditReps(currentReps);
    setEditWeight(currentWeight);
  };

  const saveEditedSet = () => {
    if (editingSetIndex !== null && editReps > 0) {
      onEditSet(editingSetIndex, editReps, editWeight);
      setEditingSetIndex(null);
      setEditReps(0);
      setEditWeight(0);
    }
  };

  const cancelEditing = () => {
    setEditingSetIndex(null);
    setEditReps(0);
    setEditWeight(0);
  };

  const handleDeleteSet = (setIndex: number) => {
    if (confirm('Are you sure you want to delete this set?')) {
      onDeleteSet(setIndex);
    }
  };

  const calculateTotalWeight = () => {
    return exercise.Sets.reduce((total, set) => total + (set.Reps * set.Weight), 0);
  };

  const calculateTotalReps = () => {
    return exercise.Sets.reduce((total, set) => total + set.Reps, 0);
  };

  // Determine if this exercise uses time-based units
  const isTimeBasedExercise = (templateExercise: TemplateExercise | null): boolean => {
    if (!templateExercise) return false;
    
    // Check if Unit field is explicitly set to "Time"
    if (templateExercise.Unit === "Time") return true;
    
    // Fallback to checking the Reps field
    const reps = templateExercise.Reps.toLowerCase();
    return reps.includes('time') || reps.includes('min') || reps.includes('sec');
  };

  const unit = isTimeBasedExercise(templateExercise) ? 'mins' : 'lbs';
  const timeBasedExercise = isTimeBasedExercise(templateExercise);

  return (
    <div className="mb-4 bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
      {/* Superset Tag */}
      {templateExercise && templateExercise.Superset && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
          {templateExercise.Superset}
        </div>
      )}

      {/* Exercise Header - Clickable */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-600 transition-colors border-b border-gray-600 relative"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between pr-12">
          <div className="flex-1">
            <h4 className="font-semibold text-lg mb-1">{exerciseName}</h4>
            <div className="text-sm text-gray-300 space-y-1">
              {exercise.Sets.length > 0 && (
                <div className="text-cyan-400">
                  Today: {exercise.Sets.length} sets • {calculateTotalReps()} reps • {calculateTotalWeight()} {unit}
                </div>
              )}
            </div>
          </div>
          <div className={`transform transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}>
            <span className="text-xl text-gray-400">▶</span>
          </div>
        </div>
      </div>

      {/* Exercise Content - Collapsible */}
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'} overflow-hidden`}>
        <div className="p-4 bg-gray-800 rounded-lg my-4">
          {templateExercise && (
            <div className="text-sm text-gray-300 mb-3">
              <p>Group: {templateExercise.Group} | Emphasis: {templateExercise.Emphasis}</p>
            </div>
          )}
          {templateExercise && (
              <div className="text-sm text-gray-300 mb-3">Target: {templateExercise.Sets} sets × {templateExercise.Reps}</div>
          )}
          {/* Mini Trend Chart */}
          {trendData.length > 1 && (
            <div className="mt-3 h-16 bg-gray-800 rounded p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="totalWeight" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Last Workout Detail */}
        {lastWorkoutData && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <h6 className="text-sm font-medium text-yellow-400 mb-2">
              Last Workout ({lastWorkoutData.workout.Date}):
            </h6>
            <div className="space-y-1">
              {lastWorkoutData.exercise.Sets.map((set, index) => (
                <div key={index} className="text-xs text-gray-300">
                  Set {set.SetNumber}: {set.Reps} × {set.Weight} {unit} = {set.Reps * set.Weight} {unit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Sets */}
        <div className="mb-4">
          <h5 className="font-medium mb-3">{`Today's Sets:`}</h5>
          {exercise.Sets.length === 0 ? (
            <p className="text-gray-400 text-sm">No sets completed yet</p>
          ) : (
            <div className="space-y-2">
              {exercise.Sets.map((set, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-800 hover:bg-gray-600 p-3 rounded">
                  {editingSetIndex === index ? (
                    // Edit mode
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium min-w-[60px]">Set {set.SetNumber}:</span>
                      <input
                        type="number"
                        value={editReps}
                        onChange={(e) => setEditReps(parseInt(e.target.value) || 0)}
                        className="w-16 p-1 bg-gray-500 text-white rounded text-sm"
                        placeholder="Reps"
                      />
                      <span className="text-sm">×</span>
                      <input
                        type="number"
                        value={editWeight}
                        onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                        className="w-16 p-1 bg-gray-500 text-white rounded text-sm"
                        placeholder={timeBasedExercise ? "Mins" : "Weight"}
                      />
                      <span className="text-sm">{unit}</span>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={saveEditedSet}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <div className="text-sm flex-1">
                        <strong>Set {set.SetNumber}:</strong> {set.Reps} reps × {set.Weight} {unit} = {set.Reps * set.Weight} {unit}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditingSet(index, set.Reps, set.Weight)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSet(index)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div className="bg-gray-800 p-2 rounded text-center">
                <div className="font-semibold text-cyan-400">
                  Total: {calculateTotalReps()} reps • {calculateTotalWeight()} {unit}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add New Set */}
        <div className="bg-gray-600 p-3 rounded">
          <h6 className="text-sm font-medium mb-2">Add Set:</h6>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={newReps}
              onChange={(e) => setNewReps(parseInt(e.target.value) || 0)}
              placeholder="Reps"
              className="w-20 p-2 bg-gray-500 text-white rounded text-sm"
            />
            <span className="text-sm">×</span>
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
              placeholder={timeBasedExercise ? "Minutes" : "Weight"}
              className="w-20 p-2 bg-gray-500 text-white rounded text-sm"
            />
            <span className="text-sm">{unit}</span>
            <button
              onClick={handleAddSet}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Add Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 