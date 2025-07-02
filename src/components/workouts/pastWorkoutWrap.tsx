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
    onDelete?: (workoutId: string) => void;
}

export function PastWorkoutWrap({ workout, onDelete }: WorkoutWrapProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the toggle
        
        if (!confirm('Are you sure you want to delete this workout?')) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch('/api/workouts', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: workout._id }),
            });

            if (response.ok) {
                onDelete?.(workout._id);
            } else {
                alert('Failed to delete workout');
            }
        } catch (error) {
            console.error('Error deleting workout:', error);
            alert('Error deleting workout');
        } finally {
            setIsDeleting(false);
        }
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
        <div className="workout-item relative">
            {/* Delete button */}
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                title="Delete workout"
            >
                {isDeleting ? '...' : '×'}
            </button>

            <h3
                onClick={toggleVisibility}
                className="text-sm font-semibold mb-2 pt-3 mt-2 border-t border-white cursor-pointer hover:text-cyan-400 transition-colors pr-8"
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
