"use client";
import React, { useState } from 'react';
import axios from 'axios';

const today = new Date();
  // Convert to EST/EDT timezone
  const estToday = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const offset = estToday.getTimezoneOffset() * 60000; // Offset in milliseconds
  const adjustedToday = new Date(estToday.getTime() - offset);

const NewDailyForm = ({ onRoutineAdded, onClose }) => {
  const [routine, setRoutine] = useState({
    Date: adjustedToday.toISOString().split('T')[0],
    Workout: false,

    Creative: false,
    "Skill Dev": false,
    "Job Search": false,
    "Social Activities": false,
    
    "Sleep Score": 0,
    "Diet Score": 0,
    "Discipline Score": 0,
    "Daily Score": 0,
    
    "Social Desc": "",
    "Creative Desc": "",
    "Skill Desc": "",
    "Job Search Desc": "",
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

      {/* Checkbox fields */}
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
          name="Creative"
          checked={routine.Creative}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Creative</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="Skill Dev"
          checked={routine["Skill Dev"]}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Skill Dev</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="Job Search"
          checked={routine["Job Search"]}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Job Search</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="Social Activities"
          checked={routine["Social Activities"]}
          onChange={handleChange}
          className="checkbox checkbox-primary"
        />
        <span>Social Activities</span>
      </label>

      {/* Other fields */}

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
      <label className="block">
        Diet Score:
        <input
          type="number"
          name="Diet Score"
          value={routine["Diet Score"]}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>
      <label className="block">
        Discipline Score:
        <input
          type="number"
          name="Discipline Score"
          value={routine["Discipline Score"]}
          onChange={handleChange}
          className="input input-bordered w-full"
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
        Social Activities:
        <input
          type="text"
          name="Social Desc"
          value={routine["Social Desc"]}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>
      
      <label className="block">
        Creative Summary:
        <textarea
          name="Creative Desc"
          value={routine["Creative Desc"]}
          onChange={handleChange}
          className="textarea textarea-bordered w-full"
        />
      </label>

      <label className="block">
        Skill Summary:
        <input
          type="text"
          name="Skill Desc"
          value={routine["Skill Desc"]}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
      </label>

      <label className="block">
        Job Search Summary:
        <input
          type="text"
          name="Job Search Desc"
          value={routine["Job Search Desc"]}
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