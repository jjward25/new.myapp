import React from 'react';

type Exercise = {
    [key: string]: {
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
        Type: string; // Added Type here to access exercise type
    };
};

interface WorkoutProps {
    exercises: Exercise;
    date: string;
}

export default function PastWorkout({ exercises, date }: WorkoutProps) {
    return (
        <div className='flex flex-col w-full justify-start mb-2'>
            <div className='w-full md:flex flex-wrap justify-center md:justify-normal'>
                {Object.keys(exercises).map((exerciseName) => (
                    <div key={`${exerciseName}-${date}`} className='m-4'>
                        <p className='text-sm mb-2 text-center md:text-left'>
                            {exerciseName} <em className='not-italic text-fuchsia-500'>{exercises[exerciseName]['Starting Max']}lbs</em> <em className='not-italic text-cyan-500'>{exercises[exerciseName]['Ending Max']}lbs</em>
                        </p>

                        {['Set 1', 'Set 2', 'Set 3', 'Set 4'].map((set, index) => {
                            const setRepsKey = `${set} Reps` as keyof typeof exercises[typeof exerciseName];
                            const setWeightKey = `${set} Weight` as keyof typeof exercises[typeof exerciseName];

                            const setReps = exercises[exerciseName][setRepsKey];
                            const setWeight = exercises[exerciseName][setWeightKey];
                            const exerciseType = exercises[exerciseName]['Type']; // Get the exercise type

                            if (setReps !== undefined) {
                                // Determine percentage based on exercise type and set index
                                let percentage;
                                if (exerciseType === "Compound") {
                                    percentage = index < 2 ? '90%' : '65%'; // 90% for first two sets, 65% for last two
                                } else if (exerciseType === "Iso") {
                                    percentage = '75%'; // 75% for all Iso sets
                                }

                                return (
                                    <div className='flex flex-row mb-1 justify-center md:justify-start' key={`${exerciseName}-${set}-${date}`}>
                                        <p className='non-italic text-xs align-middle my-auto mr-2'>
                                            {`${set} (${percentage} = ${setWeight || '0'}lbs): `}
                                        </p>
                                        <p className='text-xs'>
                                            {setReps}
                                        </p>
                                    </div>
                                );
                            }
                            return null; 
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
