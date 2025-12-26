"use client";

import React, { useState } from 'react';
import SimpleWorkoutModal from './SimpleWorkoutModal';
import WeeklyGoalsSummary from './WeeklyGoalsSummary';
import OneRepMaxChart from '../d3/OneRepMaxChart';
import DailyWorkoutChart from '../d3/DailyWorkoutChart';

export default function WorkoutSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div className='w-full overflow-hidden space-y-3'>
      {/* New Workout Button */}
      <div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer relative rounded-lg w-full overflow-hidden group"
        >
          <div className="absolute -inset-1 rounded-lg bg-teal-700 blur opacity-20 overflow-hidden"></div>
          <div className="relative rounded-lg flex justify-around border-2 border-teal-800 text-teal-500 font-semibold overflow-hidden text-sm group-hover:tracking-widest group-hover:text-teal-400 transition-all py-1">
            Workout
          </div>
        </button>
      </div>
      
      {/* Legacy Workout Link */}
      <div>
        <div className="cursor-pointer relative rounded-lg w-full overflow-hidden">
          <div className="absolute -inset-1 rounded-lg bg-yellow-700 blur opacity-20 overflow-hidden"></div>
          <a href="/workouts" title="Workout (Legacy)">
            <div className="relative rounded-lg flex justify-around border-2 border-yellow-950 dark:text-yellow-500 font-semibold overflow-hidden text-sm hover:tracking-widest hover:text-yellow-600 text-yellow-950 py-1">
              Workout (Legacy)
            </div>
          </a>
        </div>
      </div>

      {/* Weekly Goals Summary */}
      <WeeklyGoalsSummary />
      
      {/* Daily Workout Chart */}
      <DailyWorkoutChart />
      
      {/* 1RM Progress Chart */}
      <OneRepMaxChart />
      
      {/* Modal */}
      <SimpleWorkoutModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
