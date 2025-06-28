"use client";
import React, { useState, useEffect } from 'react';

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

interface PastWorkoutProps {
    workout: Workout;
}

export default function PastWorkout({ workout }: PastWorkoutProps) {
    const [templates, setTemplates] = useState<Templates | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

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

    const calculateExerciseTotal = (exercise: Exercise) => {
        return exercise.Sets.reduce((total, set) => total + (set.Reps * set.Weight), 0);
    };

    const calculateExerciseTotalReps = (exercise: Exercise) => {
        return exercise.Sets.reduce((total, set) => total + set.Reps, 0);
    };

    const getExercisesByTimeOfDay = () => {
        if (!templates) return { morning: [], evening: [], unknown: [] };

        const dayKey = `Day_${workout.Day}` as keyof Templates;
        const dayTemplate = templates[dayKey];
        
        if (!dayTemplate) return { morning: [], evening: [], unknown: [] };

        const morning: Array<[string, Exercise]> = [];
        const evening: Array<[string, Exercise]> = [];
        const unknown: Array<[string, Exercise]> = [];

        Object.entries(workout.Exercises).forEach(([exerciseName, exercise]) => {
            const templateExercise = dayTemplate.Exercises[exerciseName];
            
            if (templateExercise) {
                if (templateExercise.Time === 'Morning') {
                    morning.push([exerciseName, exercise]);
                } else if (templateExercise.Time === 'Evening') {
                    evening.push([exerciseName, exercise]);
                } else {
                    unknown.push([exerciseName, exercise]);
                }
            } else {
                unknown.push([exerciseName, exercise]);
            }
        });

        return { morning, evening, unknown };
    };

    const renderExerciseCard = (exerciseName: string, exercise: Exercise) => (
        <div key={exerciseName} className="exercise-card bg-gray-700 rounded p-3">
            <h4 className="font-semibold text-sm text-cyan-400 mb-2">{exerciseName}</h4>
            <div className="text-xs text-gray-300 mb-2">
                Type: {exercise.ExerciseType}
            </div>
            
            {/* Sets */}
            <div className="space-y-1">
                {exercise.Sets.map((set, index) => (
                    <div key={index} className="text-xs text-gray-200">
                        Set {set.SetNumber}: {set.Reps} × {set.Weight} lbs = {set.Reps * set.Weight} lbs
                    </div>
                ))}
            </div>
            
            {/* Exercise totals */}
            <div className="mt-2 pt-2 border-t border-gray-600 text-xs">
                <div className="text-yellow-400">
                    Total: {calculateExerciseTotalReps(exercise)} reps • {calculateExerciseTotal(exercise)} lbs
                </div>
            </div>
        </div>
    );

    const { morning, evening, unknown } = getExercisesByTimeOfDay();

    return (
        <div className="past-workout bg-gray-800 rounded-lg p-4 mt-2">
            {/* Morning Exercises */}
            {morning.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center">
                        <span className="mr-2">🌅</span>
                        Morning Exercises
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {morning.map(([exerciseName, exercise]) => 
                            renderExerciseCard(exerciseName, exercise)
                        )}
                    </div>
                </div>
            )}

            {/* Evening Exercises */}
            {evening.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center">
                        <span className="mr-2">🌙</span>
                        Evening Exercises
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {evening.map(([exerciseName, exercise]) => 
                            renderExerciseCard(exerciseName, exercise)
                        )}
                    </div>
                </div>
            )}

            {/* Unknown/Other Exercises */}
            {unknown.length > 0 && (
                <div className="mb-6">
                    {(morning.length > 0 || evening.length > 0) && (
                        <h3 className="text-lg font-semibold text-gray-400 mb-3 flex items-center">
                            <span className="mr-2">❓</span>
                            Other Exercises
                        </h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unknown.map(([exerciseName, exercise]) => 
                            renderExerciseCard(exerciseName, exercise)
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
