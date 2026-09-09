// src/app/page.tsx
import React from 'react';
import Routines from '../components/routines/Routines';
import TaskTrendChart from '../components/d3/TaskTrendChart';
import RoutinesBooleanBar from '../components/d3/RoutinesBarChart';
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

        {/* Charts (no data yet — revisit) */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="mc-panel p-4 w-full">
            <div className="mc-label mb-2">Tasks completed · by day</div>
            <TaskTrendChart />
          </div>
          <div className="mc-panel p-4 w-full md:max-w-[750px]">
            <div className="mc-label mb-2">Daily routines</div>
            <RoutinesBooleanBar />
          </div>
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
