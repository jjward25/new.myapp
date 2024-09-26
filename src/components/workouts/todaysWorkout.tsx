"use client";

import React, { useEffect, useState } from 'react';

interface Exercise {
    "Starting Max": number | null;
    "Set 1 Reps": number | null;
    "Set 2 Reps": number | null;
    "Set 3 Reps": number | null;
    "Set 4 Reps"?: number | null;
    "Set 1 Weight": number | null;
    "Set 2 Weight": number | null;
    "Set 3 Weight": number | null;
    "Set 4 Weight"?: number | null;
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

    const replaceNullsWithZero = (obj: Record<string, any>) => {
        if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (obj[key] === null) {
                    obj[key] = 0;
                } else {
                    replaceNullsWithZero(obj[key]);
                }
            }
        }
        return obj;
    };
    
    const handleInputChange = async (exerciseName: string, set: string, value: string) => {
    if (!todaysWorkout) return;

    const sanitizedWorkout = replaceNullsWithZero(todaysWorkout);
    const updatedExercises: Record<string, Exercise> = { ...sanitizedWorkout.Exercises };

    const setRepsKey = `${set} Reps` as keyof Exercise;

    if (updatedExercises[exerciseName]) {
        const newValue: number | null = value !== '' ? parseInt(value) : null;

        // Validate newValue
        
        updatedExercises[exerciseName][setRepsKey as keyof Exercise] = newValue;

        // Update the state with the new exercises
        setTodaysWorkout({ ...todaysWorkout, Exercises: updatedExercises });
        console.log("Updating workout with data:", updatedExercises);

        // Prepare the PUT request
        try {
            // Replace nulls with 0 before sending
            const sanitizedExercises = Object.fromEntries(
                Object.entries(updatedExercises).map(([name, exercise]) => [
                    name,
                    replaceNullsWithZero(exercise),
                ])
            );

            console.log("Request Body:", {
                date: todaysWorkout.Date,
                Exercises: sanitizedExercises,
            });

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

       

    if (!todaysWorkout) return <p className='text-sm text-neutral-400'>No Workout Found</p>;

    return (
        <div className='flex flex-col w-full justify-start mb-2'>
            <div className='w-full md:flex flex-wrap'>
                {Object.keys(todaysWorkout.Exercises).map((exerciseName) => {
                    const exercise = todaysWorkout.Exercises[exerciseName];

                    return (
                        <div key={exerciseName} className='m-4'>
                            <p className='text-sm mb-2'>
                                {exerciseName} <em className='not-italic text-fuchsia-500'>{exercise['Starting Max']}lbs</em> <em className='not-italic text-cyan-500'>{exercise['Ending Max']}lbs</em>
                            </p>

                            {['Set 1', 'Set 2', 'Set 3', 'Set 4'].map((set, index) => {
                                const setRepsKey = `${set} Reps` as keyof Exercise; 
                                const setWeightKey = `${set} Weight` as keyof Exercise;

                                const setReps = exercise[setRepsKey];
                                const setWeight = exercise[setWeightKey];

                                const hasReps = setReps !== null;
                                const hasWeight = setWeight !== null;

                                if ((index < 3 || (exercise['Set 4 Reps'] !== undefined || exercise['Set 4 Weight'] !== undefined)) && (hasReps || hasWeight)) {
                                    const exerciseType = exercise['Type'];
                                    let percentage = '0%';
                                    if (exerciseType === "Compound") {
                                        percentage = '90%'; 
                                    } else if (exerciseType === "Iso") {
                                        percentage = '75%'; 
                                    }

                                    return (
                                        <div className='flex flex-row mb-1' key={`${exerciseName}-${set}`}>
                                            <p className='non-italic text-xs align-middle my-auto mr-2'>
                                                {`${set} (${percentage} = ${setWeight || '0'}lbs): `}
                                            </p>
                                            <input
                                                className='max-w-[40px] text-xs rounded-sm text-black px-1'
                                                value={setReps !== null ? setReps : ''} 
                                                onChange={(e) => handleInputChange(exerciseName, set, e.target.value)}
                                            />
                                        </div>
                                    );
                                }
                                return null; 
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Workout;
