"use client";

import React, { useMemo } from "react";
import { getTodayEST } from "@/utils/dateUtils";
import type { WorkoutDef } from "./ExerciseLogRow";

interface Entry {
  _id: string;
  date: string;
  category: string;
  exercise: string;
}

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Most recent Sunday at/before `dateStr` -- the grid always renders
// chronological Sun..Sat, regardless of which weekday a program's cycle
// conceptually starts on.
function sundayOnOrBefore(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return addDays(dateStr, -d.getDay());
}

export default function WeekCalendar({
  program,
  defs,
  entries,
  onSelectDay,
  onStartWorkout,
  selectedDate,
}: {
  program: "baddie" | "original";
  defs: WorkoutDef[];
  entries: Entry[];
  onSelectDay: (date: string) => void;
  onStartWorkout: (date: string, def: WorkoutDef | null) => void;
  selectedDate: string | null;
}) {
  const today = getTodayEST();
  // Every program is pinned to fixed weekdays (see byWeekday below), so the
  // schedule repeats identically week over week -- one week is the whole
  // picture. A second week would only earn its keep if some program rotated
  // with an offset (e.g. an unanchored A/B/C/D cycle that drifts relative to
  // weekdays); neither program does that here.
  const gridStart = useMemo(() => sundayOnOrBefore(today), [today]);

  const programDefs = useMemo(() => defs.filter((d) => d.program === program), [defs, program]);
  const byWeekday = useMemo(() => {
    const m: Record<string, WorkoutDef> = {};
    programDefs.forEach((d) => { if (d.weekday && WEEKDAY_KEYS.includes(d.weekday)) m[d.weekday] = d; });
    return m;
  }, [programDefs]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(gridStart, i)),
    [gridStart]
  );

  const entriesByDate = useMemo(() => {
    const m: Record<string, Entry[]> = {};
    entries.forEach((e) => (m[e.date] ||= []).push(e));
    return m;
  }, [entries]);

  return (
    <div className="mc-panel p-3" style={{ background: "#171a1f", borderColor: "rgba(255,255,255,0.14)" }}>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((date) => {
          const dow = new Date(date + "T00:00:00").getDay();
          const weekdayKey = WEEKDAY_KEYS[dow];
          const suggestedDef = byWeekday[weekdayKey];
          const dayEntries = entriesByDate[date] || [];
          const hasLog = dayEntries.some((e) => e.category === suggestedDef?.category) || dayEntries.length > 0;
          const isToday = date === today;
          const isSelected = date === selectedDate;
          return (
            <button
              key={date}
              onClick={() => onSelectDay(date)}
              className={`flex flex-col items-center gap-1 rounded p-1.5 border text-left transition-colors ${
                isSelected ? "border-[#22d3ee] bg-[#22d3ee]/10" : "border-white/10 bg-[#0c0d10] hover:border-white/25"
              }`}
            >
              <span className="mc-mono text-[9px] text-[#5b626d]">{WEEKDAY_LABELS[dow]}</span>
              <span className={`mc-mono text-[12px] ${isToday ? "text-[#22d3ee] font-semibold" : "text-[#c4c9d1]"}`}>
                {date.slice(8, 10)}
              </span>
              <span className="text-[10px] text-[#8a919c] text-center leading-tight min-h-[2.2em]">
                {suggestedDef ? suggestedDef.label.replace(/^.*— /, "") : "—"}
              </span>
              {hasLog && <span className="w-1.5 h-1.5 rounded-full bg-[#35c48b]" />}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.08]">
          <span className="mc-mono text-[11px] text-[#8a919c]">{selectedDate}</span>
          {(() => {
            const dow = new Date(selectedDate + "T00:00:00").getDay();
            const suggestedDef = byWeekday[WEEKDAY_KEYS[dow]];
            const hasLog = (entriesByDate[selectedDate] || []).length > 0;
            return (
              <>
                <button
                  onClick={() => onStartWorkout(selectedDate, suggestedDef || null)}
                  className="ml-auto mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-white/[0.08] border border-white/25 text-[#e7eaee] hover:bg-[#22d3ee]/15 hover:border-[#22d3ee] hover:text-[#22d3ee]"
                >
                  {hasLog ? "Edit Workout" : "Start Workout"}
                </button>
                {hasLog && (
                  <button
                    onClick={() => onStartWorkout(selectedDate, null)}
                    className="mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]"
                  >
                    + Add Another
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
