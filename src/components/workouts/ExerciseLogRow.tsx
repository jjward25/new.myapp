"use client";

import React, { useState } from 'react';
import { triggerParticleAnimation } from '@/components/animations/GlobalAnimationProvider';

export interface DefExercise {
  name: string;
  sets?: string;
  reps?: string;
  rir?: string;
  group?: string;
  note?: string;
  superset?: string;
}
export interface WorkoutDef {
  key: string;
  label: string;
  session_type: string;
  category: string;
  freeform: boolean;
  description?: string;
  exercises: DefExercise[];
  program?: string | null;
  weekday?: string | null;
}

export const inputCls =
  "w-full bg-[#0c0d10] border border-white/20 rounded px-2 py-1.5 text-[13px] text-[#e7eaee] outline-none focus:border-[#22d3ee]";

// One exercise from a prescribed workout: shows the dose, expands to log
// actual sets (reps/weight) + RIR. No ROM field -- dropped per feedback,
// nobody was going to fill it in.
export default function ExerciseLogRow({
  ex,
  def,
  date,
  phase,
  environment,
  onLogged,
}: {
  ex: DefExercise;
  def: WorkoutDef;
  date: string;
  phase?: string;
  environment?: string;
  onLogged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState<{ reps: string; weight: string }[]>([{ reps: '', weight: '' }]);
  const [rir, setRir] = useState('');
  const [saving, setSaving] = useState(false);
  const isCardio = def.session_type === 'cardio';
  const [miles, setMiles] = useState('');
  const [minutes, setMinutes] = useState('');

  const prescribed = [ex.sets && `${ex.sets} sets`, ex.reps, ex.rir && `RIR ${ex.rir}`].filter(Boolean).join(' · ');

  const save = async () => {
    setSaving(true);
    try {
      const body: any = {
        exercise: ex.name,
        category: def.category,
        sessionType: def.session_type,
        date,
        rir: rir || null,
        notes: ex.superset ? `SS ${ex.superset}` : '',
        phase: phase || null,
        environment: environment || null,
      };
      if (isCardio && (miles || minutes)) {
        body.cardio = { miles: miles ? Number(miles) : null, minutes: minutes ? Number(minutes) : null };
      } else {
        body.sets = sets.filter((s) => s.reps || s.weight).map((s) => ({ reps: s.reps ? Number(s.reps) : null, weight: s.weight ? Number(s.weight) : null }));
      }
      await fetch('/api/workouts/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      triggerParticleAnimation();
      setSets([{ reps: '', weight: '' }]); setRir(''); setMiles(''); setMinutes(''); setOpen(false);
      onLogged();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="border border-white/10 rounded bg-[#0c0d10]">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-2.5 py-2 text-left">
        <span className="mc-mono text-[10px] text-[#5b626d] w-3">{open ? '−' : '+'}</span>
        <span className="text-[13px] font-medium text-[#e7eaee] flex-1 min-w-0 truncate">
          {ex.superset && <span className="text-[#8a919c] mr-1">[{ex.superset}]</span>}
          {ex.name}
        </span>
        <span className="mc-mono text-[10px] text-[#8a919c] shrink-0">{prescribed}</span>
      </button>
      {open && (
        <div className="px-2.5 pb-2.5 space-y-2">
          {ex.note && <p className="mc-mono text-[10px] text-[#5b626d]">{ex.note}</p>}
          {isCardio ? (
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.1" value={miles} onChange={(e) => setMiles(e.target.value)} placeholder="miles" className={inputCls} />
              <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="minutes" className={inputCls} />
            </div>
          ) : (
            <>
              {sets.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input type="number" value={s.reps} onChange={(e) => setSets((p) => p.map((x, j) => j === i ? { ...x, reps: e.target.value } : x))} placeholder={`set ${i + 1} reps`} className={inputCls} />
                  <input type="number" step="0.5" value={s.weight} onChange={(e) => setSets((p) => p.map((x, j) => j === i ? { ...x, weight: e.target.value } : x))} placeholder="weight" className={inputCls} />
                  <button onClick={() => setSets((p) => p.length > 1 ? p.filter((_, j) => j !== i) : p)} className="text-[#5b626d] hover:text-[#f0426a] px-1">✕</button>
                </div>
              ))}
              <button onClick={() => setSets((p) => [...p, { reps: '', weight: '' }])} className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] hover:text-[#22d3ee]">+ set</button>
            </>
          )}
          <select value={rir} onChange={(e) => setRir(e.target.value)} className={inputCls}>
            <option value="">RIR —</option>
            {['0', '1', '2', '3', '4+'].map((v) => <option key={v} value={v}>RIR {v}</option>)}
          </select>
          <button
            onClick={save}
            disabled={saving}
            className="w-full mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-[#22d3ee]/20 border border-[#22d3ee] text-[#22d3ee] hover:bg-[#22d3ee]/30 disabled:opacity-50"
          >
            {saving ? 'Logging…' : 'Log'}
          </button>
        </div>
      )}
    </div>
  );
}
