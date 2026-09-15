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

// A synthetic def for the day-wide freeform "+ Add exercise" fallback --
// logging something that isn't part of any named/started workout.
const FREEFORM_DEF: WorkoutDef = {
  key: "freeform",
  label: "Freeform",
  session_type: "workout",
  category: "",
  freeform: true,
  exercises: [],
};

// One titled, independently-collapsible workout within the day (the
// auto-suggested one for today's weekday, plus any started via "+ Start
// Workout" -- e.g. a nightly stretch routine alongside the main lift day).
// State (swaps/added rows/pickers) is lifted to DayShelf, keyed by workout
// key, so the day-wide "extra logged" fallback can know what every section
// has already claimed -- only collapse state is local, nothing outside
// this component needs it.
function WorkoutSection({
  workoutDef,
  byExerciseLower,
  swaps,
  added,
  swappingKey,
  addingOpen,
  allExerciseNames,
  date,
  phase,
  environment,
  onLogged,
  onOpenSwap,
  onSwap,
  onToggleAdding,
  onAddExercise,
}: {
  workoutDef: WorkoutDef;
  byExerciseLower: Record<string, Entry[]>;
  swaps: Record<string, DefExercise>;
  added: { id: number; ex: DefExercise }[];
  swappingKey: string | null;
  addingOpen: boolean;
  allExerciseNames: string[];
  date: string;
  phase: string;
  environment: string;
  onLogged: () => void;
  onOpenSwap: (origLower: string | null) => void;
  onSwap: (origLower: string, name: string) => void;
  onToggleAdding: () => void;
  onAddExercise: (name: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const prescribed = workoutDef.exercises;

  return (
    <div className="border border-white/[0.08] rounded-lg p-2.5">
      <button onClick={() => setCollapsed((v) => !v)} className="w-full flex items-center justify-between gap-2">
        <span className="mc-label">{workoutDef.label}</span>
        <span className="mc-mono text-[10px] text-[#8a919c]">{collapsed ? "Show" : "Hide"}</span>
      </button>
      {!collapsed && (
        <div className="flex flex-col gap-2 mt-2">
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
                    <ExerciseLogRow ex={ex} def={workoutDef} date={date} phase={phase} environment={environment} onLogged={onLogged} />
                  </div>
                  <button
                    onClick={() => onOpenSwap(swappingKey === origLower ? null : origLower)}
                    className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] hover:text-[#22d3ee] shrink-0"
                  >
                    Swap
                  </button>
                </div>
                {swappingKey === origLower && (
                  <ExercisePicker
                    options={allExerciseNames}
                    placeholder="Swap to…"
                    onCancel={() => onOpenSwap(null)}
                    onPick={(name) => onSwap(origLower, name)}
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
                <ExerciseLogRow ex={ex} def={workoutDef} date={date} phase={phase} environment={environment} onLogged={onLogged} />
                <p className="text-[12px] pl-1" style={{ color: logged ? "#c4c9d1" : "#8a919c" }}>
                  {logged ? loggedSummary(rows) : "not logged yet"}
                </p>
                <div className="pl-1">
                  <ExerciseTrend exercise={ex.name} />
                </div>
              </div>
            );
          })}

          {prescribed.length === 0 && added.length === 0 && (
            <p className="mc-mono text-[11px] text-[#8a919c] italic">No prescribed exercises.</p>
          )}

          <div className="mt-1">
            {!addingOpen ? (
              <button onClick={onToggleAdding} className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] hover:text-[#22d3ee]">
                + Add exercise
              </button>
            ) : (
              <ExercisePicker options={allExerciseNames} placeholder="Add exercise…" onCancel={onToggleAdding} onPick={onAddExercise} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Workouts active on this day: the auto-suggested one for today's weekday
  // (if any) plus any started explicitly via "+ Start Workout" -- e.g. a
  // nightly stretch routine alongside the main lift day. Ephemeral per day
  // view (DayShelf remounts on date change via `key={selectedDate}` in
  // ProgramView), same as the swap/added-exercise state below.
  const [addedWorkoutKeys, setAddedWorkoutKeys] = useState<string[]>([]);
  const [startingWorkout, setStartingWorkout] = useState(false);

  // Per-workout state, keyed by workout `key` -- multiple workouts can be
  // active at once, each with its own swaps/added rows/open pickers.
  const [swapsByWorkout, setSwapsByWorkout] = useState<Record<string, Record<string, DefExercise>>>({});
  const [addedExByWorkout, setAddedExByWorkout] = useState<Record<string, { id: number; ex: DefExercise }[]>>({});
  const [swappingFor, setSwappingFor] = useState<{ workoutKey: string; origLower: string } | null>(null);
  const [addingExFor, setAddingExFor] = useState<string | null>(null);
  const nextAddedId = useRef(0);

  // Day-wide freeform logging, outside any named/started workout.
  const [dayAdded, setDayAdded] = useState<{ id: number; ex: DefExercise }[]>([]);
  const [dayAddingOpen, setDayAddingOpen] = useState(false);

  const updatePhase = (v: string) => { setPhase(v); writeStored(PHASE_KEY, v); };
  const updateEnvironment = (v: string) => { setEnvironment(v); writeStored(ENV_KEY, v); };

  // Case-insensitive so a logged "Bench Press" matches a prescribed "bench press".
  const byExerciseLower = entries.reduce<Record<string, Entry[]>>((acc, e) => {
    (acc[e.exercise.toLowerCase()] ||= []).push(e);
    return acc;
  }, {});

  const activeDefs = useMemo(() => {
    const base = def ? [def] : [];
    const extra = addedWorkoutKeys.map((k) => defs.find((d) => d.key === k)).filter((d): d is WorkoutDef => !!d);
    return [...base, ...extra];
  }, [def, addedWorkoutKeys, defs]);

  const activeKeysLower = new Set(activeDefs.map((d) => d.key));
  const startableDefs = defs.filter((d) => !activeKeysLower.has(d.key));

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

  // Names already accounted for by some active workout's prescribed
  // (possibly swapped) slot, that workout's added rows, or a day-wide added
  // row -- excluded from the "extra logged" fallback so those entries don't
  // also render a second time.
  const claimedNamesLower = new Set<string>();
  activeDefs.forEach((wd) => {
    const swaps = swapsByWorkout[wd.key] || {};
    wd.exercises.forEach((ex) => claimedNamesLower.add((swaps[ex.name.toLowerCase()]?.name || ex.name).toLowerCase()));
    (addedExByWorkout[wd.key] || []).forEach((a) => claimedNamesLower.add(a.ex.name.toLowerCase()));
  });
  dayAdded.forEach((a) => claimedNamesLower.add(a.ex.name.toLowerCase()));
  const extraExerciseNames = Object.keys(byExerciseLower).filter((n) => !claimedNamesLower.has(n));

  const hasAnything = activeDefs.length > 0 || dayAdded.length > 0 || extraExerciseNames.length > 0;

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
        <p className="mc-mono text-[11px] text-[#8a919c] italic mb-2">Nothing prescribed or logged this day.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {activeDefs.map((wd) => (
            <WorkoutSection
              key={wd.key}
              workoutDef={wd}
              byExerciseLower={byExerciseLower}
              swaps={swapsByWorkout[wd.key] || {}}
              added={addedExByWorkout[wd.key] || []}
              swappingKey={swappingFor?.workoutKey === wd.key ? swappingFor.origLower : null}
              addingOpen={addingExFor === wd.key}
              allExerciseNames={allExerciseNames}
              date={date}
              phase={phase}
              environment={environment}
              onLogged={onLogged}
              onOpenSwap={(origLower) => setSwappingFor(origLower ? { workoutKey: wd.key, origLower } : null)}
              onSwap={(origLower, name) => {
                const original = wd.exercises.find((e) => e.name.toLowerCase() === origLower);
                if (!original) return;
                setSwapsByWorkout((p) => ({ ...p, [wd.key]: { ...(p[wd.key] || {}), [origLower]: { ...original, name } } }));
                setSwappingFor(null);
              }}
              onToggleAdding={() => setAddingExFor(addingExFor === wd.key ? null : wd.key)}
              onAddExercise={(name) => {
                setAddedExByWorkout((p) => ({ ...p, [wd.key]: [...(p[wd.key] || []), { id: nextAddedId.current++, ex: { name } }] }));
                setAddingExFor(null);
              }}
            />
          ))}

          {dayAdded.map(({ id, ex }) => {
            const rows = byExerciseLower[ex.name.toLowerCase()] || [];
            const logged = rows.length > 0;
            return (
              <div key={id} className="flex flex-col gap-1">
                <ExerciseLogRow ex={ex} def={FREEFORM_DEF} date={date} phase={phase} environment={environment} onLogged={onLogged} />
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

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {!dayAddingOpen ? (
          <button onClick={() => setDayAddingOpen(true)} className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] hover:text-[#22d3ee]">
            + Add exercise
          </button>
        ) : (
          <div className="w-full max-w-xs">
            <ExercisePicker
              options={allExerciseNames}
              placeholder="Add exercise…"
              onCancel={() => setDayAddingOpen(false)}
              onPick={(name) => {
                setDayAdded((p) => [...p, { id: nextAddedId.current++, ex: { name } }]);
                setDayAddingOpen(false);
              }}
            />
          </div>
        )}

        {!startingWorkout ? (
          <button
            onClick={() => setStartingWorkout(true)}
            className="mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-white/[0.08] border border-white/25 text-[#e7eaee] hover:bg-[#22d3ee]/15 hover:border-[#22d3ee] hover:text-[#22d3ee]"
          >
            + Start Workout
          </button>
        ) : (
          <div className="w-full max-w-xs">
            <ExercisePicker
              options={startableDefs.map((d) => d.label)}
              placeholder="Start workout…"
              allowNew={false}
              onCancel={() => setStartingWorkout(false)}
              onPick={(label) => {
                const chosen = startableDefs.find((d) => d.label === label);
                if (chosen) setAddedWorkoutKeys((p) => [...p, chosen.key]);
                setStartingWorkout(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
