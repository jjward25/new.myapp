// src/components/routines/NewButton.js
"use client";
import React, { useState } from 'react';
import axios from 'axios';

const today = new Date();
// Convert to EST/EDT timezone
const estToday = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
const offset = estToday.getTimezoneOffset() * 60000; // Offset in milliseconds
const adjustedToday = new Date(estToday.getTime() - offset);

const AddRoutineButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddRoutine = async () => {
    setIsLoading(true);
    
    const newRoutine = {
      Date: adjustedToday.toISOString().split('T')[0],
      Mobility: false,
      Exercise: null, // "Lift" | "Cardio" | null
      Language: false,
      Piano: false,
      ReadLearn: [], // Array of { text, link } objects
      Journal: ""
    };

    try {
      console.log('Sending routine:', newRoutine);
      const response = await axios.post('/api/routines', newRoutine);
      
      console.log('Response received:', response);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('Routine added successfully:', response.data);
        // Force a page reload to show the new routine
        window.location.reload();
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding new routine:', error);
      console.error('Error details:', error.response?.data);
      
      // Even if there's an error, the routine might have been created
      // So let's refresh the page anyway after a short delay
      setTimeout(() => {
        console.log('Refreshing page despite error...');
        window.location.reload();
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddRoutine}
      disabled={isLoading}
      className={`w-full mc-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded bg-white/[0.08] border border-white/25 text-[#e7eaee] hover:bg-[#22d3ee]/15 hover:border-[#22d3ee] hover:text-[#22d3ee] transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? 'Creating...' : '+ New Day'}
    </button>
  );
};

export default AddRoutineButton;
