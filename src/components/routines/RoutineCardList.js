"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import RoutineCard from './RoutineCard';
import { triggerAchievementAnimation } from '@/components/animations/GlobalAnimationProvider';

// Weekly targets for routines (Pass is only available for < 7)
const WEEKLY_TARGETS = {
  Mobility: 5,
  Language: 5,
  Piano: 5,
  Exercise: 5, // 2 Lift + 3 Cardio combined
  ReadLearn: 7,
  Journal: 7
};

const RoutineCardList = () => {
  const [routines, setRoutines] = useState([]);
  const [weeklyRoutines, setWeeklyRoutines] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editableRoutine, setEditableRoutine] = useState(null);

  // Get start of current week (Monday)
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  // Calculate remaining days in the week (including today)
  const getRemainingDays = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Sunday = 0, Monday = 1, ..., Saturday = 6
    // Remaining days including today: Sunday has 1, Saturday has 2, Monday has 7
    return dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  };

  const fetchMostRecentRoutines = async () => {
    try {
      const response = await axios.get('/api/routines/recent');
      setRoutines(response.data);
      if (response.data.length > 0) {
        setEditableRoutine(response.data[0]);
      }
    } catch (err) {
      console.error('Error fetching routines:', err);
    }
  };

  // Fetch all routines for the current week to calculate counts
  const fetchWeeklyRoutines = async () => {
    try {
      const response = await axios.get('/api/routines');
      const weekStart = getWeekStart();
      const filtered = response.data.filter(r => r.Date >= weekStart);
      setWeeklyRoutines(filtered);
    } catch (err) {
      console.error('Error fetching weekly routines:', err);
    }
  };

  useEffect(() => {
    fetchMostRecentRoutines();
    fetchWeeklyRoutines();
  }, []);

  // Calculate weekly counts (excluding "Pass" values)
  const weeklyCounts = useMemo(() => {
    const counts = {
      Mobility: 0,
      Language: 0,
      Piano: 0,
      Exercise: 0, // Combined Lift + Cardio
      ReadLearn: 0,
      Journal: 0
    };

    weeklyRoutines.forEach(routine => {
      // Only count true values, not "Pass"
      if (routine.Mobility === true) counts.Mobility++;
      if (routine.Language === true) counts.Language++;
      if (routine.Piano === true) counts.Piano++;
      if (routine.Exercise === 'Lift' || routine.Exercise === 'Cardio') counts.Exercise++;
      if (routine.ReadLearn && routine.ReadLearn.length > 0 && routine.ReadLearn !== 'Pass') counts.ReadLearn++;
      if (routine.Journal && routine.Journal.trim().length > 0 && routine.Journal !== 'Pass') counts.Journal++;
    });

    return counts;
  }, [weeklyRoutines]);

  const remainingDays = getRemainingDays();

  const handleInputChange = (e, key) => {
    // Handle different input types
    let value;
    
    if (key === 'ReadLearn') {
      // ReadLearn is passed as an array directly via e.target.value
      value = e.target.value;
    } else if (key === 'Exercise') {
      // Exercise can be "Lift", "Cardio", or null
      value = e.target.value;
    } else if (e.target.type === 'checkbox') {
      value = e.target.checked;
    } else {
      value = e.target.value;
    }
    
    setEditableRoutine((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditToggle = (index) => {
    setEditingIndex(index);
    setEditableRoutine(routines[index]);
  };

  // Check if all daily routines are completed (true or "Pass" both count as addressed)
  const isRoutineComplete = (routine) => {
    if (!routine) return false;
    
    // "Pass" counts as addressed for completion check
    const hasMobility = routine.Mobility === true || routine.Mobility === 'Pass';
    const hasExercise = routine.Exercise === 'Lift' || routine.Exercise === 'Cardio' || routine.Exercise === 'Pass';
    const hasLanguage = routine.Language === true || routine.Language === 'Pass';
    const hasPiano = routine.Piano === true || routine.Piano === 'Pass';
    const hasReadLearn = (routine.ReadLearn && routine.ReadLearn.length > 0) || routine.ReadLearn === 'Pass';
    const hasJournal = (routine.Journal && routine.Journal.trim().length > 0) || routine.Journal === 'Pass';
    
    return hasMobility && hasExercise && hasLanguage && hasPiano && hasReadLearn && hasJournal;
  };

  const handleSave = async () => {
    // Check if routine was incomplete before and will be complete after
    const oldRoutine = routines[editingIndex];
    const wasComplete = isRoutineComplete(oldRoutine);
    const willBeComplete = isRoutineComplete(editableRoutine);
    
    try {
      await axios.put('/api/routines', { 
        id: editableRoutine._id, 
        updatedItem: editableRoutine 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setRoutines((prev) => 
        prev.map((r, index) => (index === editingIndex ? editableRoutine : r))
      );
      setEditingIndex(null);
      setEditableRoutine(null);
      
      // Show achievement if newly completed
      if (!wasComplete && willBeComplete) {
        // Increment routines level
        try {
          const achieveResponse = await fetch('/api/achievements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pool: 'routines' }),
          });
          if (achieveResponse.ok) {
            const { level } = await achieveResponse.json();
            // Trigger global achievement animation
            triggerAchievementAnimation('🤘⛰️ The mind is solid - your routine is followed ⛰️🤘', level);
          }
        } catch (achieveError) {
          console.error('Error incrementing achievement:', achieveError);
        }
      }
    } catch (err) {
      console.error('Error updating routine:', err);
    }
  };

  const handleDelete = (id) => {
    setRoutines((prev) => prev.filter((routine) => routine._id !== id));
    if (editingIndex !== null && routines[editingIndex]._id === id) {
      setEditingIndex(null);
      setEditableRoutine(null);
    }
  };

  return (
    <div className='mb-4 w-full '>
      {routines.map((routine, index) => (
        <RoutineCard
          key={routine._id}
          routine={editingIndex === index ? editableRoutine : routine}
          isEditing={editingIndex === index}
          onInputChange={handleInputChange}
          onEditToggle={() => handleEditToggle(index)}
          onSave={handleSave}
          onDelete={handleDelete}
          weeklyCounts={weeklyCounts}
          weeklyTargets={WEEKLY_TARGETS}
          remainingDays={remainingDays}
        />
      ))}
    </div>
  );
};

export default RoutineCardList;
