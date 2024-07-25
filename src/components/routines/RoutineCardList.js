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
      await axios.put('/api/routines', { id: editableRoutine._id, updatedItem: editableRoutine }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setRoutines((prev) => 
        prev.map((r, index) => (index === editingIndex ? editableRoutine : r))
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
    <div className='mt-4'>
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
