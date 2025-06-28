"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoutineCard from './RoutineCard';

const RoutineCardList = () => {
  const [routines, setRoutines] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editableRoutine, setEditableRoutine] = useState(null);

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

  useEffect(() => {
    fetchMostRecentRoutines();
  }, []);

  const handleInputChange = (e, key) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditableRoutine((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditToggle = (index) => {
    setEditingIndex(index);
    setEditableRoutine(routines[index]);
  };

  const handleSave = async () => {
    try {
      // Calculate the daily score automatically before saving
      const calculateDailyScore = (routineData) => {
        const mainActivities = [
          routineData["Morning Exercise"],
          routineData["Evening Exercise"],
          routineData["Applications"]
        ];
        
        const bonusActivities = [
          routineData["Language"],
          routineData["Piano"],
          routineData["Reading"],
          routineData["Writing"],
          routineData["Social"],
          routineData["Cook/Meal Prep"]
        ];

        const mainCount = mainActivities.filter(Boolean).length;
        const bonusCount = bonusActivities.filter(Boolean).length;

        if (mainCount === 0) return 0;
        if (mainCount === 1) return 1;
        if (mainCount === 2) return bonusCount > 0 ? 3 : 2;
        if (mainCount === 3) return bonusCount > 0 ? 4 : 3;
        
        return 0;
      };

      const updatedRoutineWithScore = {
        ...editableRoutine,
        "Daily Score": calculateDailyScore(editableRoutine)
      };

      await axios.put('/api/routines', { 
        id: updatedRoutineWithScore._id, 
        updatedItem: updatedRoutineWithScore 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setRoutines((prev) => 
        prev.map((r, index) => (index === editingIndex ? updatedRoutineWithScore : r))
      );
      setEditingIndex(null);
      setEditableRoutine(null);
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
        />
      ))}
    </div>
  );
};

export default RoutineCardList;
