"use client";

import React, { useState } from "react";
import ProgramView from "./ProgramView";
import WorkoutProgressionChart from "./WorkoutProgressionChart";
import WorkoutHistory from "./WorkoutHistory";

type TabId = "program" | "progress" | "history";

const TABS: { id: TabId; label: string }[] = [
  { id: "program", label: "Program" },
  { id: "progress", label: "Progress" },
  { id: "history", label: "History" },
];

export default function WorkoutsClient({ sessions }: { sessions: any[] }) {
  const [tab, setTab] = useState<TabId>("program");

  return (
    <div className="mc min-h-screen bg-[#0c0d10] text-[#e7eaee]">
      <div className="w-full max-w-[1100px] mx-auto px-3 md:px-6 py-6 flex flex-col gap-5">
        <div>
          <h1 className="mc-mono text-lg tracking-[0.2em] text-[#e7eaee]">WORKOUTS</h1>
          <p className="mc-mono text-[11px] text-[#8a919c] mt-1">
            The program, your progression, every logged session. Logging lives on the home page.
          </p>
        </div>

        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded ${
                tab === t.id
                  ? "bg-[#22d3ee] text-[#0c0d10]"
                  : "bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "program" && <ProgramView />}
        {tab === "progress" && <WorkoutProgressionChart />}
        {tab === "history" && <WorkoutHistory sessions={sessions} />}
      </div>
    </div>
  );
}
