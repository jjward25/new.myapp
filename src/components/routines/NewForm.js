"use client";
import React, { useState } from 'react';
import axios from 'axios';

const NewDailyForm = ({ onRoutineAdded, onClose }) => {
  const [routine, setRoutine] = useState({
    Date: new Date().toISOString().split('T')[0],
    "Sleep Score": 0,
    "Fab Morning": false,
    "Work Score": 0,
    Workout: false,
    Piano: false,
    "Prof Dev": false,
    "Project Work": false,
    Spanish: false,
    "Fab Evening": false,
    "Protein %": 0,
    "Calories %": 0,
    "Social Activities": "",
    "Mood Score": 0,
    "Mood Summary": "",
    "Performance Score": 0,
    "Performance Rating": "",
    Journal: ""
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoutine(prevRoutine => ({
      ...prevRoutine,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    try {
      const response = await axios.post('/api/routines', routine);
      if (response.status === 200) {
        onRoutineAdded(response.data); // Pass the new routine data to parent
      } else {
        throw new Error('Failed to add routine');
      }
    } catch (error) {
      console.error('Error adding routine:', error);
      setError('Failed to Add Routine. Please try again.');
    } finally {
      if (onClose) onClose(); // Close the form regardless of success or failure
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-auto">
      {/* Date */}
      <label className="block">
        Date:
        <input
          type="date"
          name="Date"
          value={routine.Date}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>

      {/* Sleep Score */}
      <label className="block">
        Sleep Score:
        <input
          type="number"
          name="Sleep Score"
          value={routine["Sleep Score"]}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>

      {/* Checkbox fields */}
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="Fab Morning"
          checked={routine["Fab Morning"]}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Fab Morning</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="Workout"
          checked={routine.Workout}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Workout</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="Piano"
          checked={routine.Piano}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Piano</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="Prof Dev"
          checked={routine["Prof Dev"]}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Prof Dev</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="Project Work"
          checked={routine["Project Work"]}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Project Work</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="Spanish"
          checked={routine.Spanish}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Spanish</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="Fab Evening"
          checked={routine["Fab Evening"]}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Fab Evening</span>
      </label>

      {/* Other fields */}
      <label className="block">
        Protein %:
        <input
          type="number"
          name="Protein %"
          value={routine["Protein %"]}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>
      <label className="block">
        Calories %:
        <input
          type="number"
          name="Calories %"
          value={routine["Calories %"]}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>
      <label className="block">
        Social Activities:
        <input
          type="text"
          name="Social Activities"
          value={routine["Social Activities"]}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>
      <label className="block">
        Mood Score:
        <input
          type="number"
          name="Mood Score"
          value={routine["Mood Score"]}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>
      <label className="block">
        Mood Summary:
        <textarea
          name="Mood Summary"
          value={routine["Mood Summary"]}
          onChange={handleChange}
          className="textarea textarea-bordered w-full"
        />
      </label>
      <label className="block">
        Daily Score:
        <input
          type="number"
          name="Daily Score"
          value={routine["Daily Score"]}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>
      <label className="block">
        Daily Rating:
        <input
          type="text"
          name="Daily Rating"
          value={routine["Daily Rating"]}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>
      <label className="block">
        Journal:
        <textarea
          name="Journal"
          value={routine.Journal}
          onChange={handleChange}
          className="textarea textarea-bordered w-full"
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary bg-cyan-700 hover:bg-cyan-800 text-neutral-100 w-full"
      >
        Add Routine
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
};

export default NewDailyForm;
