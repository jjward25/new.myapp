"use client"

import React, { useEffect, useState } from 'react';
import WorkoutTrendChart from './WorkoutTrendChart';

const fetchData = async () => {
  try {
    // Fetch workouts and templates
    const [workoutsResponse, templatesResponse] = await Promise.all([
      fetch('/api/workouts'),
      fetch('/api/workouts/templates')
    ]);
    
    const workouts = await workoutsResponse.json();
    const templatesData = await templatesResponse.json();
    const templates = templatesData.Templates;

    const workoutDays = [];

    if (Array.isArray(workouts) && templates) {
      // Group workouts by date to aggregate morning/evening counts
      const workoutsByDate = {};

      workouts.forEach(workout => {
        // Only include workouts that have at least one exercise with sets
        const completedExercises = Object.entries(workout.Exercises || {}).filter(([_, exercise]) => 
          exercise.Sets && exercise.Sets.length > 0
        );

        if (completedExercises.length > 0) {
          const date = workout.Date;
          
          if (!workoutsByDate[date]) {
            workoutsByDate[date] = {
              date: date,
              day: workout.Day,
              morningCount: 0,
              eveningCount: 0,
              totalExercises: 0
            };
          }

          // Get template for this workout day
          const dayKey = `Day_${workout.Day}`;
          const template = templates[dayKey];
          
          if (template) {
            // Count morning and evening exercises
            let morningExercises = 0;
            let eveningExercises = 0;
            
            completedExercises.forEach(([exerciseName, _]) => {
              const templateExercise = template.Exercises[exerciseName];
              if (templateExercise) {
                if (templateExercise.Time === 'Morning') {
                  morningExercises++;
                } else if (templateExercise.Time === 'Evening') {
                  eveningExercises++;
                }
              }
            });

            // If there are morning exercises, count as 1 morning workout
            if (morningExercises > 0) {
              workoutsByDate[date].morningCount = 1;
            }
            // If there are evening exercises, count as 1 evening workout  
            if (eveningExercises > 0) {
              workoutsByDate[date].eveningCount = 1;
            }
            
            workoutsByDate[date].totalExercises = completedExercises.length;
          }
        }
      });

      // Convert to array format
      workoutDays.push(...Object.values(workoutsByDate));
    }

    return workoutDays;
  } catch (error) {
    console.error('Error fetching workout data:', error);
    return [];
  }
};

const WorkoutTrendComponent = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData().then(data => {
      setData(data);
    });
  }, []);

  return (
    <div className="p-4 mx-auto bg-gradient-to-tr from-black to-slate-800 rounded-lg w-full h-full">
      <h1 className="text-xl font-semibold text-cyan-800">Workout Days (Last 30 Days)</h1>
      <WorkoutTrendChart data={data} />
      <div id="workout-tooltip" style={{
        position: 'absolute',
        background: 'white',
        border: '1px solid #ccc',
        padding: '8px',
        borderRadius: '4px',
        pointerEvents: 'none',
        display: 'none',
        fontSize: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000
      }} />
    </div>
  );
};

export default WorkoutTrendComponent; 