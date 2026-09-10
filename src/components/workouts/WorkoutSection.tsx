"use client";

import React, { useState } from 'react';
import SimpleWorkoutModal from './SimpleWorkoutModal';
import WeeklyGoalsSummary from './WeeklyGoalsSummary';
import BenchmarksPanel from './BenchmarksPanel';
import OneRepMaxChart from '../d3/OneRepMaxChart';
import DailyWorkoutChart from '../d3/DailyWorkoutChart';

export default function WorkoutSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div className='w-full overflow-hidden space-y-3'>
      {/* New Workout Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full mc-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded bg-white/[0.08] border border-white/25 text-[#e7eaee] hover:bg-[#22d3ee]/15 hover:border-[#22d3ee] hover:text-[#22d3ee] transition-colors"
      >
        + Log Workout
      </button>

      {/* Weekly Goals Summary */}
      <WeeklyGoalsSummary />

      {/* Mobility Benchmarks */}
      <BenchmarksPanel />

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
