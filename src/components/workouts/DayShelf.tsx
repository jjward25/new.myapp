"use client";

import React, { useEffect, useState } from "react";
import type { WorkoutDef } from "./ExerciseLogRow";

interface Entry {
  _id: string;
  exercise: string;
  sets: { reps: number | null; weight: number | null }[] | null;
  cardio: { miles: number | null; minutes: number | null } | null;
  date: string;
  category: string;
  rir: string | null;
  notes: string;
}

const topSetWeight = (e: Entry) => Math.max(0, ...(e.sets || []).map((s) => s.weight || 0));

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return <span className="mc-mono text-[10px] text-[#5b626d]">not enough history yet</span>;
  const w = 90, h = 24, pad = 2;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={coords.join(" ")} fill="none" stroke="#22d3ee" strokeWidth={1.5} />
      <circle cx={coords[coords.length - 1].split(",")[0]} cy={coords[coords.length - 1].split(",")[1]} r={2} fill="#22d3ee" />
    </svg>
  );
}

function ExerciseTrend({ exercise }: { exercise: string }) {
  const [history, setHistory] = useState<Entry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/workouts/log?exercise=${encodeURIComponent(exercise)}&sinceDays=180`)
      .then((r) => r.json())
      .then((rows: Entry[]) => { if (!cancelled) setHistory(rows.slice().reverse()); })
      .catch(() => setHistory([]));
    return () => { cancelled = true; };
  }, [exercise]);

  if (history === null) return <span className="mc-mono text-[10px] text-[#5b626d]">loading…</span>;
  const points = history.filter((e) => e.sets?.length).map(topSetWeight);
  const last = history[history.length - 1];

  return (
    <div className="flex items-center gap-3">
      <Sparkline points={points} />
      {last && (
        <span className="mc-mono text-[10px] text-[#8a919c]">
          last: {(last.sets || []).map((s) => `${s.reps ?? "?"}${s.weight ? `×${s.weight}` : ""}`).join(", ") || (last.cardio ? `${last.cardio.miles ?? "?"}mi` : "—")}
        </span>
      )}
    </div>
  );
}

export default function DayShelf({
  date,
  entries,
  def,
  onClose,
}: {
  date: string;
  entries: Entry[];
  def?: WorkoutDef | null;
  onClose: () => void;
}) {
  // Case-insensitive so a logged "Bench Press" matches a prescribed "bench press".
  const byExerciseLower = entries.reduce<Record<string, Entry[]>>((acc, e) => {
    (acc[e.exercise.toLowerCase()] ||= []).push(e);
    return acc;
  }, {});

  const prescribed = def?.exercises ?? [];
  const prescribedNamesLower = new Set(prescribed.map((ex) => ex.name.toLowerCase()));
  // Logged exercises that aren't part of today's prescribed list (freeform
  // additions via "+ Add Another") still need to show up.
  const extraExerciseNames = Object.keys(byExerciseLower).filter((n) => !prescribedNamesLower.has(n));

  const prescribedDose = (ex: { sets?: string; reps?: string; rir?: string }) =>
    [ex.sets && `${ex.sets} sets`, ex.reps, ex.rir && `RIR ${ex.rir}`].filter(Boolean).join(" · ");

  const hasAnything = prescribed.length > 0 || extraExerciseNames.length > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-[900px] rounded-t-xl border border-b-0 border-white/[0.14] p-4 max-h-[50vh] overflow-y-auto"
        style={{ background: "#171a1f", boxShadow: "0 -8px 30px rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="mc-label">{date}</span>
          <button onClick={onClose} className="ml-auto text-[#5b626d] hover:text-[#e7eaee]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {!hasAnything ? (
          <p className="mc-mono text-[11px] text-[#8a919c] italic">Nothing prescribed or logged this day.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {prescribed.map((ex) => {
              const rows = byExerciseLower[ex.name.toLowerCase()] || [];
              const logged = rows.length > 0;
              return (
                <div key={ex.name} className="border border-white/10 rounded bg-[#0c0d10] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-[#e7eaee]">
                      {ex.superset && <span className="text-[#5b626d] mr-1">[{ex.superset}]</span>}
                      {ex.name}
                    </span>
                    {logged && rows[0].rir && <span className="mc-mono text-[10px] text-[#8a919c]">RIR {rows[0].rir}</span>}
                  </div>
                  <p className="mc-mono text-[10px] text-[#5b626d] mt-0.5">{prescribedDose(ex)}</p>
                  <p className="text-[12px] mt-1" style={{ color: logged ? "#c4c9d1" : "#5b626d" }}>
                    {logged
                      ? rows.flatMap((r) => r.sets || []).map((s) => `${s.reps ?? "?"}${s.weight ? `×${s.weight}` : ""}`).join(", ") ||
                        (rows[0].cardio ? `${rows[0].cardio.miles ?? "?"} mi${rows[0].cardio.minutes ? ` / ${rows[0].cardio.minutes} min` : ""}` : "—")
                      : "not logged yet"}
                  </p>
                  <div className="mt-2">
                    <ExerciseTrend exercise={ex.name} />
                  </div>
                </div>
              );
            })}
            {extraExerciseNames.map((nameLower) => {
              const rows = byExerciseLower[nameLower];
              const exercise = rows[0].exercise;
              return (
                <div key={exercise} className="border border-white/10 rounded bg-[#0c0d10] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-[#e7eaee]">{exercise}</span>
                    {rows[0].rir && <span className="mc-mono text-[10px] text-[#8a919c]">RIR {rows[0].rir}</span>}
                  </div>
                  <p className="text-[12px] text-[#c4c9d1] mt-1">
                    {rows.flatMap((r) => r.sets || []).map((s) => `${s.reps ?? "?"}${s.weight ? `×${s.weight}` : ""}`).join(", ") ||
                      (rows[0].cardio ? `${rows[0].cardio.miles ?? "?"} mi${rows[0].cardio.minutes ? ` / ${rows[0].cardio.minutes} min` : ""}` : "—")}
                  </p>
                  <div className="mt-2">
                    <ExerciseTrend exercise={exercise} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
