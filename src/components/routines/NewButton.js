// src/components/routines/NewButton.js
"use client";
import React from 'react';
import axios from 'axios';

const today = new Date();
// Convert to EST/EDT timezone
const estToday = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
const offset = estToday.getTimezoneOffset() * 60000; // Offset in milliseconds
const adjustedToday = new Date(estToday.getTime() - offset);

const AddRoutineButton = () => {

  const handleAddRoutine = async () => {
    const newRoutine = {
      Date: adjustedToday.toISOString().split('T')[0],
      "6am Wakeup": false,
      "Sleep Score": 0,
      "Mobility": false,
      "Language": false,
      "Piano": false,
      "Breakfast": "",
      "Done by 730": false,
      "Lunch": false,
      "Dinner": false,
      "Reading": false,
      "Job Search": false,
      "Tasks": false,
      "Workout": false,
      "Workout Type": "",
      "Call": false,
      "Events": false,
      "Events Desc": "",
      "Reading Desc": "",
      "Daily Score": 0,
      "Journal": ""
    };

    try {
      const response = await axios.post('/api/routines', newRoutine);
      
      console.log('Full Response:', response); // Log the full response
      
      if (response.status >= 200 && response.status < 300) {
        console.log('Routine added successfully:', response.data);
        setTimeout(() => {
          window.location.reload(); // Reload after success
        }, 100);
      } else {
        throw new Error('Failed to insert routine into database.');
      }
    } catch (error) {
      console.error('Error adding new routine:', error);
    }
  };

  return (
    <button
      onClick={handleAddRoutine}
      className="btn px-6 border-cyan-700 hover:border-cyan-500 btn-secondary bg-gradient-to-br from-black via-slate-800 to-neutral-800 hover:bg-black text-cyan-700 hover:text-fuchsia-400 w-full max-w-[1000px]"
    >
      New Day
    </button>
  );
};

export default AddRoutineButton;
