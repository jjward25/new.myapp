// src/app/page.tsx
import React from 'react';
import Routines from '../components/routines/Routines';
import TaskTrendChart from '../components/d3/TaskTrendChart';
import RoutinesBooleanBar from '../components/d3/RoutinesBarChart';
import DailyWorkoutChart from '../components/d3/DailyWorkoutChart';
import Calendar from '@/components/calendar/calendar';
import AddEventButton from '@/components/calendar/AddEventButton';
import WorkoutSection from '../components/workouts/WorkoutSection';
import KPIDashboard from '../components/kpis/KPIDashboard';
import HermesChat from '@/components/hermes/HermesChat';
import OpsBoard from '@/components/home/OpsBoard';

export const revalidate = 3600; // Regenerate the page every hour

export default async function Home() {
  return (
    <main className="mc flex min-h-screen flex-col items-center gap-6 p-3 md:px-10 md:pt-6 pb-16 w-full bg-[#0c0d10]">
      <div className="w-full max-w-[1200px] flex flex-col gap-6">
        <KPIDashboard />

        <OpsBoard />

        {/* Calendar */}
        <div className="mc-panel overflow-hidden">
          <Calendar />
          <div className="border-t border-white/[0.08]">
            <AddEventButton />
          </div>
        </div>

        {/* Ask Hermes — above the charts */}
        <HermesChat title="Ask Hermes" placeholder="Ask Hermes anything…" />

        {/* Charts: Daily routines / Tasks completed / Daily workouts — one row,
            fixed shared height on desktop so all three charts actually fill
            their panel instead of floating in a tall box with dead space. */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_1fr] md:grid-rows-[1fr] gap-3 md:h-[340px] overflow-hidden">
          <div className="mc-panel p-4 w-full h-full flex flex-col overflow-hidden">
            <div className="mc-label mb-2 shrink-0">Daily routines</div>
            <RoutinesBooleanBar />
          </div>
          <div className="mc-panel p-4 w-full h-full flex flex-col overflow-hidden">
            <div className="mc-label mb-2 shrink-0">Tasks completed · by day</div>
            <TaskTrendChart />
          </div>
          <DailyWorkoutChart />
        </div>

        {/* Routines + Workout */}
        <div className="w-full md:grid md:grid-cols-2 md:gap-6">
          <div className="w-full md:border-r md:border-white/[0.08] md:pr-6 border-t border-white/[0.08] pt-5 md:pt-0 mt-3 md:mt-0 md:border-t-0">
            <Routines />
          </div>
          <div className="flex flex-col items-center mx-auto w-full md:pl-6">
            <WorkoutSection />
          </div>
        </div>
      </div>
    </main>
  );
}
