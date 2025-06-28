// src/components/workouts/pastWorkoutWrap.tsx
"use client";
import React, { useState } from 'react';
import PastWorkout from './pastWorkout';

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

interface WorkoutWrapProps {
    workout: Workout;
}

export function PastWorkoutWrap({ workout }: WorkoutWrapProps) {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    // Calculate total sets and total reps for summary
    const calculateWorkoutSummary = () => {
        let totalSets = 0;
        let totalReps = 0;
        let totalWeight = 0;

        Object.values(workout.Exercises).forEach(exercise => {
            totalSets += exercise.Sets.length;
            exercise.Sets.forEach(set => {
                totalReps += set.Reps;
                totalWeight += set.Reps * set.Weight;
            });
        });

        return { totalSets, totalReps, totalWeight };
    };

    const { totalSets, totalReps, totalWeight } = calculateWorkoutSummary();

    return (
        <div className="workout-item">
            <h3
                onClick={toggleVisibility}
                className="text-sm font-semibold mb-2 pt-3 mt-2 border-t border-white cursor-pointer hover:text-cyan-400 transition-colors"
            >
                {workout.Date}: <em className="not-italic text-amber-500">{workout.WorkoutName}</em> (Day {workout.Day})
            </h3>
            
            {/* Workout Summary */}
            <div className="text-xs text-gray-400 mb-2">
                {totalSets} sets • {totalReps} total reps • {totalWeight} lbs total volume
            </div>

            {/* Conditionally render the Workout component */}
            {isVisible && (
                <PastWorkout workout={workout} />
            )}
        </div>
    );
}
