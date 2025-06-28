"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface ChartData {
  date: string;
  [key: string]: number | string;
}

interface EnhancedChartData {
  date: string;
  previousValues?: Record<string, number>;
  [key: string]: number | string | Record<string, number> | undefined;
}

export default function WorkoutProgressionChart() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [templates, setTemplates] = useState<Templates | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [filterType, setFilterType] = useState<'Day' | 'Group' | 'Exercise'>('Day');
  const [weightChartData, setWeightChartData] = useState<EnhancedChartData[]>([]);
  const [repsChartData, setRepsChartData] = useState<EnhancedChartData[]>([]);
  const [availableFilters, setAvailableFilters] = useState<string[]>([]);

  useEffect(() => {
    fetchWorkouts();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (workouts.length > 0 && templates) {
      updateAvailableFilters();
    }
  }, [workouts, templates, filterType]);

  useEffect(() => {
    if (selectedFilter && workouts.length > 0) {
      generateChartData();
    }
  }, [selectedFilter, workouts, filterType]);

  const fetchWorkouts = async () => {
    try {
      const response = await fetch('/api/workouts');
      const data = await response.json();
      if (Array.isArray(data)) {
        setWorkouts(data.sort((a: Workout, b: Workout) => new Date(a.Date).getTime() - new Date(b.Date).getTime()));
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/workouts/templates');
      const data = await response.json();
      if (data.Templates) {
        setTemplates(data.Templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const updateAvailableFilters = () => {
    if (!templates) return;

    let filters: string[] = [];

    switch (filterType) {
      case 'Day':
        filters = ['A', 'B', 'C', 'D'];
        break;
      case 'Group':
        const groups = new Set<string>();
        (Object.values(templates) as WorkoutTemplate[]).forEach(template => {
          (Object.values(template.Exercises) as TemplateExercise[]).forEach((exercise) => {
            // Split comma-separated groups and add each individually
            const exerciseGroups = exercise.Group.split(',').map(g => g.trim());
            exerciseGroups.forEach(group => {
              if (group) groups.add(group);
            });
          });
        });
        filters = Array.from(groups).sort();
        break;
      case 'Exercise':
        const exercises = new Set<string>();
        workouts.forEach(workout => {
          if (workout.Exercises) {
            Object.keys(workout.Exercises).forEach(exercise => {
              exercises.add(exercise);
            });
          }
        });
        filters = Array.from(exercises).sort();
        break;
    }

    setAvailableFilters(filters);
  };

  const getExercisesForFilter = (): string[] => {
    if (!templates) return [];

    switch (filterType) {
      case 'Day':
        const dayKey = `Day_${selectedFilter}` as keyof Templates;
        return templates[dayKey] ? Object.keys(templates[dayKey].Exercises) : [];
      case 'Group':
        const groupExercises: string[] = [];
        (Object.values(templates) as WorkoutTemplate[]).forEach(template => {
          (Object.entries(template.Exercises) as [string, TemplateExercise][]).forEach(([exerciseName, exercise]) => {
            // Check if the selected filter is in the comma-separated groups
            const exerciseGroups = exercise.Group.split(',').map(g => g.trim());
            if (exerciseGroups.includes(selectedFilter)) {
              groupExercises.push(exerciseName);
            }
          });
        });
        return groupExercises;
      case 'Exercise':
        return [selectedFilter];
      default:
        return [];
    }
  };

  const calculateTotalWeight = (exercise: Exercise): number => {
    return exercise.Sets.reduce((total, set) => total + (set.Reps * set.Weight), 0);
  };

  const calculateTotalReps = (exercise: Exercise): number => {
    return exercise.Sets.reduce((total, set) => total + set.Reps, 0);
  };

  const generateChartData = () => {
    const relevantExercises = getExercisesForFilter();
    const weightDataArray: EnhancedChartData[] = [];
    const repsDataArray: EnhancedChartData[] = [];

    // Track previous values for each exercise
    const previousWeightValues: Record<string, number> = {};
    const previousRepsValues: Record<string, number> = {};

    workouts.forEach(workout => {
      const weightData: EnhancedChartData = { date: workout.Date, previousValues: {} };
      const repsData: EnhancedChartData = { date: workout.Date, previousValues: {} };
      let hasRelevantData = false;

      relevantExercises.forEach(exerciseName => {
        if (workout.Exercises && workout.Exercises[exerciseName]) {
          const totalWeight = calculateTotalWeight(workout.Exercises[exerciseName]);
          const totalReps = calculateTotalReps(workout.Exercises[exerciseName]);
          
          // Store previous values for percentage calculation
          if (weightData.previousValues) {
            weightData.previousValues[exerciseName] = previousWeightValues[exerciseName] || 0;
          }
          if (repsData.previousValues) {
            repsData.previousValues[exerciseName] = previousRepsValues[exerciseName] || 0;
          }
          
          weightData[exerciseName] = totalWeight;
          repsData[exerciseName] = totalReps;
          
          // Update previous values for next iteration
          previousWeightValues[exerciseName] = totalWeight;
          previousRepsValues[exerciseName] = totalReps;
          
          hasRelevantData = true;
        }
      });

      if (hasRelevantData) {
        weightDataArray.push(weightData);
        repsDataArray.push(repsData);
      }
    });

    setWeightChartData(weightDataArray);
    setRepsChartData(repsDataArray);
  };

  const getRandomColor = (index: number): string => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ffff00'];
    return colors[index % colors.length];
  };

  // Custom tooltip for weight chart
  const CustomWeightTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg"
          style={{ zIndex: 1000 }}
        >
          <p className="text-white font-semibold mb-2">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => {
            const currentValue = entry.value;
            const previousValue = entry.payload?.previousValues?.[entry.dataKey] || 0;
            const percentChange = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;
            const changeSymbol = percentChange > 0 ? '+' : '';
            const changeColor = percentChange > 0 ? 'text-green-400' : percentChange < 0 ? 'text-red-400' : 'text-gray-400';
            
            return (
              <p key={index} style={{ color: entry.color }} className="mb-1">
                {`${entry.dataKey}: ${currentValue} lbs`}
                {previousValue > 0 && (
                  <span className={`ml-2 ${changeColor}`}>
                    ({changeSymbol}{percentChange.toFixed(1)}%)
                  </span>
                )}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for reps chart
  const CustomRepsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg"
          style={{ zIndex: 1000 }}
        >
          <p className="text-white font-semibold mb-2">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => {
            const currentValue = entry.value;
            const previousValue = entry.payload?.previousValues?.[entry.dataKey] || 0;
            const percentChange = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;
            const changeSymbol = percentChange > 0 ? '+' : '';
            const changeColor = percentChange > 0 ? 'text-green-400' : percentChange < 0 ? 'text-red-400' : 'text-gray-400';
            
            return (
              <p key={index} style={{ color: entry.color }} className="mb-1">
                {`${entry.dataKey}: ${currentValue} reps`}
                {previousValue > 0 && (
                  <span className={`ml-2 ${changeColor}`}>
                    ({changeSymbol}{percentChange.toFixed(1)}%)
                  </span>
                )}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="text-black p-4">
      <h3 className="text-xl font-bold mb-4">Workout Progression</h3>
      
      {/* Filter Controls */}
      <div className="mb-6 space-x-4 flex flex-row">
        <div>
          <label className="block text-sm font-medium">Filter Type:</label>
          <select 
            value={filterType} 
            onChange={(e) => {
              setFilterType(e.target.value as 'Day' | 'Group' | 'Exercise');
              setSelectedFilter('');
            }}
            className="bg-gray-800 text-white border border-gray-600 rounded p-2"
          >
            <option value="Day">By Day</option>
            <option value="Group">By Muscle Group</option>
            <option value="Exercise">By Exercise</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium">Select {filterType}:</label>
          <select 
            value={selectedFilter} 
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-gray-800 text-white border border-gray-600 rounded p-2"
          >
            <option value="">Choose {filterType.toLowerCase()}...</option>
            {availableFilters.map(filter => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Total Weight Chart */}
      {weightChartData.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">Total Weight Progression</h4>
          <div className="bg-gray-800 rounded-lg p-4 relative" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  label={{ value: 'Total Weight (lbs)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  content={<CustomWeightTooltip />}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend wrapperStyle={{ zIndex: 1 }} />
                {getExercisesForFilter().map((exercise, index) => (
                  <Line
                    key={exercise}
                    type="monotone"
                    dataKey={exercise}
                    stroke={getRandomColor(index)}
                    strokeWidth={2}
                    dot={{ fill: getRandomColor(index), strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Total Reps Chart */}
      {repsChartData.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">Total Reps Progression</h4>
          <div className="bg-gray-800 rounded-lg p-4 relative" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={repsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  label={{ value: 'Total Reps', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  content={<CustomRepsTooltip />}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend wrapperStyle={{ zIndex: 1 }} />
                {getExercisesForFilter().map((exercise, index) => (
                  <Line
                    key={`reps-${exercise}`}
                    type="monotone"
                    dataKey={exercise}
                    stroke={getRandomColor(index)}
                    strokeWidth={2}
                    dot={{ fill: getRandomColor(index), strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {weightChartData.length === 0 && selectedFilter && (
        <div className="text-gray-400 text-center py-8">
          No data available for the selected filter.
        </div>
      )}
    </div>
  );
} 