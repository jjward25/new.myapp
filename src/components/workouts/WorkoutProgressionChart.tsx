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
    const colors = ['#22d3ee', '#35c48b', '#f5a623', '#f0426a', '#a78bfa', '#38bdf8', '#facc15', '#fb7185'];
    return colors[index % colors.length];
  };

  // Custom tooltip for weight chart
  const CustomWeightTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="rounded-lg p-3 shadow-lg" style={{ background: "#171a1f", border: "1px solid rgba(255,255,255,0.16)", zIndex: 1000 }}
        >
          <p className="mc-mono text-[11px] text-[#e7eaee] font-semibold mb-2">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => {
            const currentValue = entry.value;
            const previousValue = entry.payload?.previousValues?.[entry.dataKey] || 0;
            const percentChange = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;
            const changeSymbol = percentChange > 0 ? '+' : '';
            const changeColor = percentChange > 0 ? 'text-[#35c48b]' : percentChange < 0 ? 'text-[#f0426a]' : 'text-[#8a919c]';
            
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
          className="rounded-lg p-3 shadow-lg" style={{ background: "#171a1f", border: "1px solid rgba(255,255,255,0.16)", zIndex: 1000 }}
        >
          <p className="mc-mono text-[11px] text-[#e7eaee] font-semibold mb-2">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => {
            const currentValue = entry.value;
            const previousValue = entry.payload?.previousValues?.[entry.dataKey] || 0;
            const percentChange = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;
            const changeSymbol = percentChange > 0 ? '+' : '';
            const changeColor = percentChange > 0 ? 'text-[#35c48b]' : percentChange < 0 ? 'text-[#f0426a]' : 'text-[#8a919c]';
            
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
    <div className="mc-panel p-4" style={{ background: "#171a1f", borderColor: "rgba(255,255,255,0.14)" }}>
      <div className="mc-label mb-4">Workout Progression</div>
      
      {/* Filter Controls */}
      <div className="mb-6 space-x-4 flex flex-row">
        <div>
          <label className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] block mb-1">Filter</label>
          <select 
            value={filterType} 
            onChange={(e) => {
              setFilterType(e.target.value as 'Day' | 'Group' | 'Exercise');
              setSelectedFilter('');
            }}
            className="bg-[#0c0d10] border border-white/20 rounded px-2 py-1.5 text-[13px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
          >
            <option value="Day">By Day</option>
            <option value="Group">By Muscle Group</option>
            <option value="Exercise">By Exercise</option>
          </select>
        </div>
        
        <div>
          <label className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] block mb-1">{filterType}</label>
          <select 
            value={selectedFilter} 
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-[#0c0d10] border border-white/20 rounded px-2 py-1.5 text-[13px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
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
          <div className="mc-mono text-[11px] uppercase tracking-widest text-[#c4c9d1] mb-3">Total Weight Progression</div>
          <div className="rounded-lg p-4 relative" style={{ height: '400px', background: '#0c0d10', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#8a919c"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#8a919c"
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
          <div className="mc-mono text-[11px] uppercase tracking-widest text-[#c4c9d1] mb-3">Total Reps Progression</div>
          <div className="rounded-lg p-4 relative" style={{ height: '400px', background: '#0c0d10', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={repsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#8a919c"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#8a919c"
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
        <div className="mc-mono text-[11px] text-[#8a919c] text-center py-8">
          No data available for the selected filter.
        </div>
      )}
    </div>
  );
} 