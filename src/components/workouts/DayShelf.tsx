"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ExerciseLogRow, { inputCls, type DefExercise, type WorkoutDef } from "./ExerciseLogRow";
import ExercisePicker from "./ExercisePicker";

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

const PHASES = ["ESTABLISH", "PUSH", "DELOAD"] as const;
const ENVIRONMENTS = ["Full Gym", "No Machines", "Home Setup"] as const;
const PHASE_KEY = "fitness.lastPhase";
const ENV_KEY = "fitness.lastEnvironment";

function readStored(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage can throw in private-browsing/blocked-storage contexts --
    // losing the remembered value is fine, the app still works without it.
  }
}

const topSetWeight = (e: Entry) => Math.max(0, ...(e.sets || []).map((s) => s.weight || 0));

const loggedSummary = (rows: Entry[]) =>
  rows.flatMap((r) => r.sets || []).map((s) => `${s.reps ?? "?"}${s.weight ? `×${s.weight}` : ""}`).join(", ") ||
  (rows[0]?.cardio ? `${rows[0].cardio.miles ?? "?"} mi${rows[0].cardio.minutes ? ` / ${rows[0].cardio.minutes} min` : ""}` : "—");

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return <span className="mc-mono text-[10px] text-[#8a919c]">not enough history yet</span>;
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

  if (history === null) return <span className="mc-mono text-[10px] text-[#8a919c]">loading…</span>;
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

// A synthetic def for freeform-only logging on a day with no prescribed
// workout -- ExerciseLogRow needs a WorkoutDef for category/session_type,
// even when there's nothing actually planned.
const FREEFORM_DEF: WorkoutDef = {
  key: "freeform",
  label: "Freeform",
  session_type: "workout",
  category: "",
  freeform: true,
  exercises: [],
};

export default function DayShelf({
  entries,
  def,
  defs,
  date,
  onLogged,
}: {
  entries: Entry[];
  def?: WorkoutDef | null;
  defs: WorkoutDef[];
  date: string;
  onLogged: () => void;
}) {
  const [phase, setPhase] = useState(() => readStored(PHASE_KEY));
  const [environment, setEnvironment] = useState(() => readStored(ENV_KEY));
  // Keyed by the ORIGINAL prescribed exercise's lowercased name so the row's
  // React `key` never changes when swapped -- swapping must not remount
  // ExerciseLogRow (that would silently discard an in-progress open/expanded
  // input).
  const [swaps, setSwaps] = useState<Record<string, DefExercise>>({});
  const [added, setAdded] = useState<{ id: number; ex: DefExercise }[]>([]);
  const [swappingKey, setSwappingKey] = useState<string | null>(null);
  const [addingOpen, setAddingOpen] = useState(false);
  const nextAddedId = useRef(0);

  const updatePhase = (v: string) => { setPhase(v); writeStored(PHASE_KEY, v); };
  const updateEnvironment = (v: string) => { setEnvironment(v); writeStored(ENV_KEY, v); };

  // Case-insensitive so a logged "Bench Press" matches a prescribed "bench press".
  const byExerciseLower = entries.reduce<Record<string, Entry[]>>((acc, e) => {
    (acc[e.exercise.toLowerCase()] ||= []).push(e);
    return acc;
  }, {});

  const prescribed = def?.exercises ?? [];

  const effectiveDef = def ?? FREEFORM_DEF;

  // Every exercise name across BOTH programs, deduped case-insensitively --
  // already fetched by ProgramView, no new API call needed for the picker.
  const allExerciseNames = useMemo(() => {
    const seen = new Map<string, string>();
    defs.forEach((d) => d.exercises.forEach((e) => {
      const lower = e.name.toLowerCase();
      if (!seen.has(lower)) seen.set(lower, e.name);
    }));
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [defs]);

  // Names already accounted for by a prescribed (possibly swapped) slot or a
  // freeform-added row -- excluded from the "extra logged" fallback so a
  // swapped/added exercise's log entries don't also render a second time.
  const claimedNamesLower = new Set([
    ...prescribed.map((ex) => (swaps[ex.name.toLowerCase()]?.name || ex.name).toLowerCase()),
    ...added.map((a) => a.ex.name.toLowerCase()),
  ]);
  const extraExerciseNames = Object.keys(byExerciseLower).filter((n) => !claimedNamesLower.has(n));

  const hasAnything = prescribed.length > 0 || added.length > 0 || extraExerciseNames.length > 0;

  return (
    <div className="pt-3 mt-3 border-t border-white/[0.08]">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <select value={phase} onChange={(e) => updatePhase(e.target.value)} className={inputCls}>
          <option value="">Phase —</option>
          {PHASES.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
        </select>
        <select value={environment} onChange={(e) => updateEnvironment(e.target.value)} className={inputCls}>
          <option value="">Environment —</option>
          {ENVIRONMENTS.map((env) => <option key={env} value={env}>{env}</option>)}
        </select>
      </div>

      {!hasAnything ? (
        <p className="mc-mono text-[11px] text-[#8a919c] italic">Nothing prescribed or logged this day.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {prescribed.map((original) => {
            const origLower = original.name.toLowerCase();
            const swap = swaps[origLower];
            const ex = swap ? { ...original, name: swap.name } : original;
            const rows = byExerciseLower[ex.name.toLowerCase()] || [];
            const logged = rows.length > 0;
            return (
              <div key={origLower} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <ExerciseLogRow ex={ex} def={effectiveDef} date={date} phase={phase} environment={environment} onLogged={onLogged} />
                  </div>
                  <button
                    onClick={() => setSwappingKey(swappingKey === origLower ? null : origLower)}
                    className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] hover:text-[#22d3ee] shrink-0"
                  >
                    Swap
                  </button>
                </div>
                {swappingKey === origLower && (
                  <ExercisePicker
                    options={allExerciseNames}
                    placeholder="Swap to…"
                    onCancel={() => setSwappingKey(null)}
                    onPick={(name) => {
                      setSwaps((p) => ({ ...p, [origLower]: { ...original, name } }));
                      setSwappingKey(null);
                    }}
                  />
                )}
                <p className="text-[12px] pl-1" style={{ color: logged ? "#c4c9d1" : "#8a919c" }}>
                  {logged ? loggedSummary(rows) : "not logged yet"}
                </p>
                <div className="pl-1">
                  <ExerciseTrend exercise={ex.name} />
                </div>
              </div>
            );
          })}

          {added.map(({ id, ex }) => {
            const rows = byExerciseLower[ex.name.toLowerCase()] || [];
            const logged = rows.length > 0;
            return (
              <div key={id} className="flex flex-col gap-1">
                <ExerciseLogRow ex={ex} def={effectiveDef} date={date} phase={phase} environment={environment} onLogged={onLogged} />
                <p className="text-[12px] pl-1" style={{ color: logged ? "#c4c9d1" : "#8a919c" }}>
                  {logged ? loggedSummary(rows) : "not logged yet"}
                </p>
                <div className="pl-1">
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
                  <span className="text-[13px] font-medium text-[#e7eaee]">{exercise}</span>
                  {rows[0].rir && <span className="mc-mono text-[10px] text-[#8a919c]">RIR {rows[0].rir}</span>}
                </div>
                <p className="text-[12px] text-[#c4c9d1] mt-1">{loggedSummary(rows)}</p>
                <div className="mt-2">
                  <ExerciseTrend exercise={exercise} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-2">
        {!addingOpen ? (
          <button
            onClick={() => setAddingOpen(true)}
            className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] hover:text-[#22d3ee]"
          >
            + Add exercise
          </button>
        ) : (
          <ExercisePicker
            options={allExerciseNames}
            placeholder="Add exercise…"
            onCancel={() => setAddingOpen(false)}
            onPick={(name) => {
              setAdded((p) => [...p, { id: nextAddedId.current++, ex: { name } }]);
              setAddingOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
