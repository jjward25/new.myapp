// src/components/workouts/pastWorkoutWrap.tsx
"use client";
import React, { useState } from 'react';
import PastWorkout from './pastWorkout';

interface Exercise {
    "Starting Max": number | null;
    Set1Reps: number | null;
    Set2Reps: number | null;
    Set3Reps: number | null;
    Set4Reps: number | null;
    Set1Weight: number | null;
    Set2Weight: number | null;
    Set3Weight: number | null;
    Set4Weight: number | null;
    "Ending Max": number | null;
}

interface Workout {
    _id: string;
    Date: string; // Change this to Date if it's a Date object
    Workout: string;
    Exercises: Record<string, Exercise>; // Using Record to represent exercises as a dictionary
}

interface WorkoutWrapProps {
    workout: Workout; // Specify the type for workout prop
}

export function PastWorkoutWrap({ workout }: WorkoutWrapProps) {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    return (
        <div className="workout-item">
            <h3
                onClick={toggleVisibility}
                className="text-sm font-semibold mb-2 pt-3 mt-2 border-t border-white cursor-pointer"
            >
                {workout.Date}: <em className="not-italic text-amber-500">{workout.Workout}</em>
            </h3>

            {/* Conditionally render the Workout component */}
            {isVisible && (
                <PastWorkout exercises={workout.Exercises} date={workout.Date} />
            )}
        </div>
    );
}
