"use client"
// src/components/workouts/newWorkout.tsx
import React, { useEffect, useState } from 'react';

interface Exercise {
    "Starting Max": number | null;
    "Set 1 Reps": number | null;  
    "Set 2 Reps": number | null;  
    "Set 3 Reps": number | null;  
    "Set 1 Weight": number | null; 
    "Set 2 Weight": number | null; 
    "Set 3 Weight": number | null; 
    "Ending Max": number | null;
    "Type": string;                
    "Set 4 Reps"?: number | null;  // Optional property for Compound exercises
    "Set 4 Weight"?: number | null; // Optional property for Compound exercises
}

interface Workout {
    Date: string;
    Workout: string;
    Exercises: Record<string, Exercise>;
}

export default function NewWorkoutBtn() {
    const [lastWorkout, setLastWorkout] = useState<Workout | null>(null);
    const [workoutType, setWorkoutType] = useState<string | null>(null);

    const fetchLastWorkout = async () => {
        const response = await fetch('/api/workouts');
        const workouts: Workout[] = await response.json();
        if (workouts.length > 0) {
            const sortedWorkouts = workouts.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
            setLastWorkout(sortedWorkouts[0]);
            setWorkoutType(sortedWorkouts[0].Workout); // Set the initial workout type
        }
    };

    useEffect(() => {
        fetchLastWorkout();
    }, []);

    const handleCreateWorkout = async () => {
        if (!lastWorkout || !workoutType) return;

        const newWorkoutType = workoutType === "Upper Compounds" ? "Lower Compounds" : "Upper Compounds";
        const newWorkout: Workout = {
            Date: new Date().toISOString().split('T')[0], // Today's date
            Workout: newWorkoutType,
            Exercises: {},
        };

        const response = await fetch('/api/workouts');
        const allWorkouts: Workout[] = await response.json();
        const lastWorkoutOfSameType = allWorkouts
            .filter(workout => workout.Workout === newWorkoutType)
            .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0];

        if (lastWorkoutOfSameType) {
            for (const exercise in lastWorkoutOfSameType.Exercises) {
                const endingMax = lastWorkoutOfSameType.Exercises[exercise]['Ending Max'];
                const exerciseType = lastWorkoutOfSameType.Exercises[exercise]['Type'];

                if (endingMax !== null) {
                    const exerciseData = lastWorkoutOfSameType.Exercises[exercise];

                    // Create new exercise with null reps
                    const newExercise: Exercise = {
                        "Starting Max": endingMax,
                        "Ending Max": null,
                        "Type": exerciseType,
                        "Set 1 Reps": null,  // Set reps to null
                        "Set 2 Reps": null,  // Set reps to null
                        "Set 3 Reps": null,  // Set reps to null
                        "Set 1 Weight": null,
                        "Set 2 Weight": null,
                        "Set 3 Weight": null,
                        // Conditionally add Set 4 properties
                    };

                    // Assign weights based on existing reps, with limitations
                    if (exerciseType === "Compound") {
                        newExercise["Set 4 Reps"] = null; // Set 4 Reps is null for Compound
                        newExercise["Set 4 Weight"] = null; // Set 4 Weight is null for Compound
                        if (exerciseData["Set 1 Reps"] !== null) {
                            newExercise["Set 1 Weight"] = endingMax * 0.9;  
                        }
                        if (exerciseData["Set 2 Reps"] !== null) {
                            newExercise["Set 2 Weight"] = endingMax * 0.9;  
                        }
                        if (exerciseData["Set 3 Reps"] !== null) {
                            newExercise["Set 3 Weight"] = endingMax * 0.65; 
                        }
                        if (exerciseData["Set 4 Reps"] !== null) {
                            newExercise["Set 4 Weight"] = endingMax * 0.65; 
                        }
                    } else if (exerciseType === "Iso") {
                        // Only three sets for Iso
                        if (exerciseData["Set 1 Reps"] !== null) {
                            newExercise["Set 1 Weight"] = endingMax * 0.75; 
                        }
                        if (exerciseData["Set 2 Reps"] !== null) {
                            newExercise["Set 2 Weight"] = endingMax * 0.75; 
                        }
                        if (exerciseData["Set 3 Reps"] !== null) {
                            newExercise["Set 3 Weight"] = endingMax * 0.75; 
                        }
                        // Set 4 properties do not exist for Iso
                    }

                    newWorkout.Exercises[exercise] = newExercise;
                }
            }
        } else {
            console.error('No last workout of the same type found');
            return;
        }

        const createResponse = await fetch('/api/workouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newWorkout),
        });

        if (createResponse.ok) {
            const result = await createResponse.json();
            console.log('New workout created:', result);
            setLastWorkout(null);
            setWorkoutType(newWorkoutType);
            await fetchLastWorkout(); // Re-fetch the last workout
        } else {
            console.error('Error creating workout:', createResponse.statusText);
        }
    };

    return (
        <button
            className="max-w-[200px] text-sm bg-cyan-950 border border-amber-500 p-1 rounded-lg text-cyan-500 cursor-pointer mb-2 hover:bg-fuchsia-950 hover:text-white"
            onClick={handleCreateWorkout}
        >
            Today's Workout
        </button>
    );
}
