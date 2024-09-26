"use client";

import React, { useEffect, useState } from 'react';

interface Exercise {
    "Starting Max": number | null;
    "Set 1 Reps": number | null;
    "Set 2 Reps": number | null;
    "Set 3 Reps": number | null;
    "Set 4 Reps"?: number | null; // Optional
    "Set 1 Weight": number | null;
    "Set 2 Weight": number | null;
    "Set 3 Weight": number | null;
    "Set 4 Weight"?: number | null; // Optional
    "Ending Max": number | null;
    "Type": string; 
}

interface WorkoutProps {
    Exercises: Record<string, Exercise>;
    Date: string; 
}

const Workout: React.FC = () => {
    const [todaysWorkout, setTodaysWorkout] = useState<WorkoutProps | null>(null);
    
    useEffect(() => {
        const fetchWorkout = async () => {
            const response = await fetch('/api/workouts/today');
            const data = await response.json();

            if (data.length > 0) {
                setTodaysWorkout(data[0]);
            }
        };

        fetchWorkout();
    }, []);

    const handleInputChange = async (exerciseName: string, set: 'Set 1' | 'Set 2' | 'Set 3' | 'Set 4', value: string) => {
        if (!todaysWorkout) return;
    
        const updatedExercises: Record<string, Exercise> = { ...todaysWorkout.Exercises };
        const exercise = updatedExercises[exerciseName];

        if (exercise) {
            const newValue: number | null = value !== '' ? parseInt(value) : null;

            // Ensure the type is valid before assignment
            if (exercise.hasOwnProperty(`${set} Reps`)) {
                exercise[`${set} Reps`] = newValue; 
            }

            setTodaysWorkout({ ...todaysWorkout, Exercises: updatedExercises });
    
            try {
                const sanitizedExercises = Object.fromEntries(
                    Object.entries(updatedExercises).map(([name, exercise]) => [name, exercise])
                );

                const response = await fetch(`/api/workouts/today`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        date: todaysWorkout.Date,
                        Exercises: sanitizedExercises,
                    }),
                });

                if (!response.ok) {
                    const errorMessage = await response.text();
                    console.error('Failed to update workout:', errorMessage);
                } else {
                    console.log('Workout updated successfully');
                }
            } catch (error) {
                console.error('Error updating workout:', error);
            }
        } else {
            console.error(`Exercise ${exerciseName} not found in updatedExercises.`);
        }
    };

    const handleEndingMaxChange = async (exerciseName: string, value: string) => {
        if (!todaysWorkout) return;

        const updatedExercises: Record<string, Exercise> = { ...todaysWorkout.Exercises };
        const exercise = updatedExercises[exerciseName];

        if (exercise) {
            const newEndingMax: number | null = value !== '' ? parseInt(value) : null;
            exercise["Ending Max"] = newEndingMax;

            setTodaysWorkout({ ...todaysWorkout, Exercises: updatedExercises });

            try {
                const sanitizedExercises = Object.fromEntries(
                    Object.entries(updatedExercises).map(([name, exercise]) => [name, exercise])
                );

                const response = await fetch(`/api/workouts/today`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        date: todaysWorkout.Date,
                        Exercises: sanitizedExercises,
                    }),
                });

                if (!response.ok) {
                    const errorMessage = await response.text();
                    console.error('Failed to update workout:', errorMessage);
                } else {
                    console.log('Workout updated successfully');
                }
            } catch (error) {
                console.error('Error updating workout:', error);
            }
        }
    };

    if (!todaysWorkout) return <p className='text-sm text-neutral-400'>No Workout Found</p>;

    return (
        <div className='flex flex-col w-full mb-2'>
            <div className='w-full md:flex flex-wrap justify-center md:justify-normal'>
                {Object.keys(todaysWorkout.Exercises).map((exerciseName) => {
                    const exercise = todaysWorkout.Exercises[exerciseName];

                    return (
                        <div key={exerciseName} className='my-4 md:ml-2 md:mr-8'>
                            <p className='text-sm mb-2 text-center md:text-left'>
                                {exerciseName} <em className='not-italic text-fuchsia-500'>{exercise['Starting Max']}lbs</em> <em className='not-italic text-cyan-500'>{exercise['Ending Max']}lbs</em>
                            </p>

                            {['Set 1', 'Set 2', 'Set 3', exercise.Type === "Compound" ? 'Set 4' : null].map((set) => {
                                if (!set) return null;

                                const setRepsKey = `${set} Reps` as keyof Exercise;
                                const setWeightKey = `${set} Weight` as keyof Exercise;

                                const setReps = exercise[setRepsKey] ?? null;
                                const setWeight = exercise[setWeightKey] ?? null;

                                // Ensure we only render if reps or weight is available
                                if (setReps !== null || setWeight !== null) {
                                    const exerciseType = exercise['Type'];
                                    let percentage = '0%';
                                    if (exerciseType === "Compound") {
                                        percentage = '90%'; 
                                    } else if (exerciseType === "Iso") {
                                        percentage = '75%'; 
                                    }

                                    return (
                                        <div className='flex flex-row mb-1 justify-center md:justify-start' key={`${exerciseName}-${set}`}>
                                            <p className='non-italic text-xs align-middle my-auto mr-2 text-center'>
                                                {`${set} (${percentage} = ${setWeight || '0'}lbs): `} 
                                            </p>
                                            <input
                                                className='max-w-[40px] text-xs rounded-sm text-black px-1 text-center'
                                                value={setReps !== null ? setReps : ''} 
                                                onChange={(e) => handleInputChange(exerciseName, set as 'Set 1' | 'Set 2' | 'Set 3' | 'Set 4', e.target.value)}
                                            />
                                        </div>
                                    );
                                }

                                

                                return null; 
                            })}

                            {/* Input for Ending Max */}
                            <div className='flex flex-row mb-1 justify-center md:justify-start'>
                                    <p className='non-italic text-xs align-middle my-auto mr-2 text-center'>
                                        Ending Max: 
                                    </p>
                                    <input
                                        className='max-w-[40px] text-xs rounded-sm text-black px-1 text-center'
                                        value={exercise['Ending Max'] !== null ? exercise['Ending Max'] : ''} 
                                        onChange={(e) => handleEndingMaxChange(exerciseName, e.target.value)}
                                    />
                                </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Workout;
