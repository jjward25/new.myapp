"use client";

import React, { useCallback, useEffect, useState } from "react";
import { mission, goalLegend } from "@/data/fitnessProgram";
import type { WorkoutDef } from "./ExerciseLogRow";
import WeekCalendar from "./WeekCalendar";
import DayShelf from "./DayShelf";
import StartWorkoutModal from "./StartWorkoutModal";
import PhilosophyPanel from "./PhilosophyPanel";
import { getTodayEST } from "@/utils/dateUtils";

const PROGRAMS = [
  { key: "baddie" as const, label: "Full Body Baddie" },
  { key: "original" as const, label: "Original Full Body" },
];

export default function ProgramView() {
  const [program, setProgram] = useState<"baddie" | "original">("baddie");
  const [defs, setDefs] = useState<WorkoutDef[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayEST());
  const [modal, setModal] = useState<{ date: string; def: WorkoutDef | null } | null>(null);

  const load = useCallback(async () => {
    const [d, e] = await Promise.all([
      fetch("/api/workouts/definitions").then((r) => r.json()).catch(() => []),
      fetch("/api/workouts/log?sinceDays=30").then((r) => r.json()).catch(() => []),
    ]);
    setDefs(d);
    setEntries(e);
  }, []);

  useEffect(() => { load(); }, [load]);

  const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const programDefs = defs.filter((d) => d.program === program);
  const dayEntries = entries.filter((e) => e.date === selectedDate);
  const selectedDef = selectedDate
    ? programDefs.find((d) => d.weekday === WEEKDAY_KEYS[new Date(selectedDate + "T00:00:00").getDay()]) || null
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Mission -- condensed */}
      <div className="mc-panel px-4 py-3" style={{ background: "#171a1f", borderColor: "rgba(255,255,255,0.14)" }}>
        <p className="text-[16px] font-semibold leading-snug bg-clip-text text-transparent bg-gradient-to-r from-[#22d3ee] via-[#a78bfa] to-[#f5a623]">
          {mission.headline}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {goalLegend.map((g: any) => (
            <span key={g.key} className="mc-mono text-[10px] px-2 py-0.5 rounded border border-white/10 text-[#c4c9d1]">
              {g.emoji} {g.label}
            </span>
          ))}
        </div>
      </div>

      {/* Program selector */}
      <div className="flex gap-1">
        {PROGRAMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setProgram(p.key)}
            className={`mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded ${
              program === p.key ? "bg-[#22d3ee] text-[#0c0d10]" : "bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <WeekCalendar
        program={program}
        defs={defs}
        entries={entries}
        selectedDate={selectedDate}
        onSelectDay={setSelectedDate}
        onStartWorkout={(date, def) => setModal({ date, def })}
      />

      <PhilosophyPanel />

      {selectedDate && (
        <DayShelf date={selectedDate} entries={dayEntries} def={selectedDef} onClose={() => setSelectedDate(null)} />
      )}

      {modal && (
        <StartWorkoutModal
          date={modal.date}
          programDefs={programDefs}
          initialDef={modal.def}
          onClose={() => setModal(null)}
          onLogged={load}
        />
      )}
    </div>
  );
}
