"use client";

import React, { useState } from "react";
import ExerciseLogRow, { inputCls, type WorkoutDef } from "./ExerciseLogRow";

const ENVIRONMENTS = ["Full Gym", "No Machines", "Home Setup"] as const;

export default function StartWorkoutModal({
  date,
  programDefs,
  initialDef,
  onClose,
  onLogged,
}: {
  date: string;
  programDefs: WorkoutDef[];
  initialDef: WorkoutDef | null;
  onClose: () => void;
  onLogged: () => void;
}) {
  const [selectedKey, setSelectedKey] = useState(initialDef?.key || programDefs[0]?.key || "");
  // UI only for now -- exercise substitution per environment (e.g. no-machines
  // hamstring curl -> monkeyfoot attachment) is designed separately, not wired yet.
  const [environment, setEnvironment] = useState<(typeof ENVIRONMENTS)[number]>("Full Gym");

  const def = programDefs.find((d) => d.key === selectedKey);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#131519] rounded-xl border border-white/[0.14] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="mc-label">{date}</div>
          <button onClick={onClose} className="text-[#5b626d] hover:text-[#e7eaee]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3 border-b border-white/[0.08] grid grid-cols-2 gap-2">
          <div>
            <label className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] block mb-1">Workout</label>
            <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} className={inputCls}>
              {programDefs.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] block mb-1">Environment</label>
            <select value={environment} onChange={(e) => setEnvironment(e.target.value as typeof environment)} className={inputCls}>
              {ENVIRONMENTS.map((env) => <option key={env} value={env}>{env}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {def?.exercises.map((ex) => (
            <ExerciseLogRow key={ex.name} ex={ex} def={def} date={date} onLogged={onLogged} />
          ))}
          {def && def.exercises.length === 0 && (
            <p className="mc-mono text-[11px] text-[#5b626d]">No prescribed exercises.</p>
          )}
        </div>
      </div>
    </div>
  );
}
