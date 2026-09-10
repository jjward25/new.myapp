"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { triggerParticleAnimation } from '@/components/animations/GlobalAnimationProvider';
import { refreshKPIs } from '@/components/kpis/KPIDashboard';
import { getTodayEST } from '@/utils/dateUtils';

interface DefExercise {
  name: string;
  sets?: string;
  reps?: string;
  rir?: string;
  group?: string;
  note?: string;
  superset?: string;
}
interface WorkoutDef {
  key: string;
  label: string;
  session_type: string;
  category: string;
  freeform: boolean;
  description?: string;
  exercises: DefExercise[];
}
interface LoggedEntry {
  _id: string;
  exercise: string;
  sets: { reps: number | null; weight: number | null; unit?: string }[] | null;
  cardio: { miles: number | null; minutes: number | null } | null;
  date: string;
  category: string;
  rir: string | null;
  rom: string | null;
  notes: string;
}

const inputCls =
  "w-full bg-[#0c0d10] border border-white/20 rounded px-2 py-1.5 text-[13px] text-[#e7eaee] outline-none focus:border-[#22d3ee]";

// Simple-mode category config (unchanged behavior)
const SIMPLE_CATEGORIES = [
  { name: 'Cardio', selector: 'type', exercises: [] as string[] },
  { name: 'Chest+Tris', selector: 'intensity', exercises: ['Push ups', 'Flies', 'Bench', 'Dips'] },
  { name: 'Shoulders', selector: 'intensity', exercises: ['DB Raises', 'Military Press', 'Face Pulls', 'Hangs', 'Pullover'] },
  { name: 'Quads', selector: 'intensity', exercises: ['Sissy Squats', 'Leg Extensions', 'Squats'] },
  { name: 'Hamstrings', selector: 'intensity', exercises: ['Jeffersons', 'RDLs', 'Hamstring Curls', 'Squats'] },
  { name: 'Hips', selector: 'intensity', exercises: ['Thrusts', 'Cossack Squats', 'Leg Raises', 'L-Sit'] },
  { name: 'Back+Bis', selector: 'intensity', exercises: ['Curls', 'Pull-ups', 'Rows'] },
  { name: 'Core', selector: 'none', exercises: ['Plank', 'Sit-ups'] },
  { name: '1RM', selector: '1rm', exercises: ['Bench', 'Squat', 'Deadlift', 'Pull-Ups', '5k'] },
];

interface Props { isOpen: boolean; onClose: () => void; }

export default function SimpleWorkoutModal({ isOpen, onClose }: Props) {
  const today = getTodayEST();
  const [defs, setDefs] = useState<WorkoutDef[]>([]);
  const [selectedKey, setSelectedKey] = useState('simple');
  const [todaysEntries, setTodaysEntries] = useState<LoggedEntry[]>([]);

  const selectedDef = defs.find((d) => d.key === selectedKey);

  const loadDefs = useCallback(async () => {
    try {
      const r = await fetch('/api/workouts/definitions');
      setDefs(await r.json());
    } catch (e) { console.error(e); }
  }, []);

  const loadTodays = useCallback(async () => {
    try {
      const r = await fetch(`/api/workouts/log?sinceDays=2`);
      const all: LoggedEntry[] = await r.json();
      setTodaysEntries(all.filter((e) => e.date === today));
    } catch (e) { console.error(e); }
  }, [today]);

  useEffect(() => {
    if (isOpen) { loadDefs(); loadTodays(); }
  }, [isOpen, loadDefs, loadTodays]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#131519] rounded-xl border border-white/[0.14] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="mc-label">Log Workout</div>
          <button onClick={onClose} className="text-[#5b626d] hover:text-[#e7eaee]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Workout selector */}
        <div className="p-3 border-b border-white/[0.08]">
          <label className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] block mb-1">Workout</label>
          <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} className={inputCls}>
            {defs.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
          {selectedDef?.description && (
            <p className="mc-mono text-[11px] text-[#5b626d] mt-1.5">{selectedDef.description}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedDef?.freeform ? (
            <SimpleLog today={today} onLogged={() => { loadTodays(); refreshKPIs(); }} />
          ) : selectedDef ? (
            <ProgramLog def={selectedDef} today={today} onLogged={() => { loadTodays(); refreshKPIs(); }} />
          ) : (
            <p className="mc-mono text-[11px] text-[#5b626d]">Loading…</p>
          )}

          {/* Today's logged entries */}
          <div className="mt-5 pt-4 border-t border-white/[0.08]">
            <div className="mc-label mb-2">Logged Today</div>
            {todaysEntries.length === 0 ? (
              <p className="mc-mono text-[11px] text-[#8a919c] italic">Nothing logged yet today.</p>
            ) : (
              <div className="space-y-1.5">
                {todaysEntries.map((e) => (
                  <div key={e._id} className="flex items-center justify-between bg-[#0c0d10] border border-white/10 rounded px-2 py-1.5">
                    <div className="min-w-0">
                      <span className="mc-mono text-[10px] text-[#8a919c]">{e.category}</span>
                      <p className="text-[13px] text-[#e7eaee] truncate">
                        {e.exercise}
                        {e.cardio && ` — ${e.cardio.miles ?? '?'} mi${e.cardio.minutes ? ` / ${e.cardio.minutes} min` : ''}`}
                        {e.sets && ` — ${e.sets.map((s) => `${s.reps ?? '?'}${s.weight ? `×${s.weight}` : ''}`).join(', ')}`}
                        {e.rir && ` · RIR ${e.rir}`}
                        {e.rom && e.rom !== '—' && ` · ROM ${e.rom}`}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch('/api/workouts/log', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: e._id }) });
                        loadTodays(); refreshKPIs();
                      }}
                      className="text-[#5b626d] hover:text-[#f0426a] ml-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- program-workout logging ---------------- */

function ProgramLog({ def, today, onLogged }: { def: WorkoutDef; today: string; onLogged: () => void }) {
  return (
    <div className="space-y-2">
      {def.exercises.map((ex) => (
        <ExerciseLogRow key={ex.name} ex={ex} def={def} today={today} onLogged={onLogged} />
      ))}
      {def.exercises.length === 0 && (
        <p className="mc-mono text-[11px] text-[#5b626d]">No prescribed exercises.</p>
      )}
    </div>
  );
}

function ExerciseLogRow({ ex, def, today, onLogged }: { ex: DefExercise; def: WorkoutDef; today: string; onLogged: () => void }) {
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState<{ reps: string; weight: string }[]>([{ reps: '', weight: '' }]);
  const [rir, setRir] = useState('');
  const [rom, setRom] = useState('—');
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
        date: today,
        rir: rir || null,
        rom: rom === '—' ? null : rom,
        notes: ex.superset ? `SS ${ex.superset}` : '',
      };
      if (isCardio && (miles || minutes)) {
        body.cardio = { miles: miles ? Number(miles) : null, minutes: minutes ? Number(minutes) : null };
      } else {
        body.sets = sets.filter((s) => s.reps || s.weight).map((s) => ({ reps: s.reps ? Number(s.reps) : null, weight: s.weight ? Number(s.weight) : null }));
      }
      await fetch('/api/workouts/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      triggerParticleAnimation();
      setSets([{ reps: '', weight: '' }]); setRir(''); setRom('—'); setMiles(''); setMinutes(''); setOpen(false);
      onLogged();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="border border-white/10 rounded bg-[#0c0d10]">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-2.5 py-2 text-left">
        <span className="mc-mono text-[10px] text-[#5b626d] w-3">{open ? '−' : '+'}</span>
        <span className="text-[13px] text-[#e7eaee] flex-1 min-w-0 truncate">
          {ex.superset && <span className="text-[#5b626d] mr-1">[{ex.superset}]</span>}
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
          <div className="grid grid-cols-2 gap-2">
            <select value={rir} onChange={(e) => setRir(e.target.value)} className={inputCls}>
              <option value="">RIR —</option>
              {['0', '1', '2', '3', '4+'].map((v) => <option key={v} value={v}>RIR {v}</option>)}
            </select>
            <select value={rom} onChange={(e) => setRom(e.target.value)} className={inputCls}>
              <option value="—">ROM —</option>
              <option value="held">ROM held</option>
              <option value="shortened">ROM shortened</option>
            </select>
          </div>
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

/* ---------------- simple / freeform logging (kept) ---------------- */

function SimpleLog({ today, onLogged }: { today: string; onLogged: () => void }) {
  const [cat, setCat] = useState(SIMPLE_CATEGORIES[0]);
  const [exerciseType, setExerciseType] = useState('Jog');
  const [intensity, setIntensity] = useState('Heavy');
  const [exerciseName, setExerciseName] = useState('');
  const [miles, setMiles] = useState('');
  const [time, setTime] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [oneRmExercise, setOneRmExercise] = useState('Bench');
  const [oneRmValue, setOneRmValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setExerciseName(cat.exercises.length ? cat.exercises[0] : '');
  }, [cat]);

  const add = async () => {
    setSaving(true);
    const exercise: any = { Category: cat.name };
    if (cat.name === 'Cardio') {
      exercise.ExerciseType = exerciseType;
      if (miles) exercise.Miles = Number(miles);
      if (time) exercise.Time = Number(time);
    } else if (cat.name === '1RM') {
      exercise.ExerciseName = oneRmExercise;
      if (oneRmExercise === '5k') exercise.Time = Number(oneRmValue);
      else exercise.Weight = Number(oneRmValue);
    } else {
      exercise.ExerciseName = exerciseName;
      if (cat.selector === 'intensity') exercise.Intensity = intensity;
      if (sets) exercise.Sets = Number(sets);
      if (reps) exercise.Reps = Number(reps);
      if (weight) exercise.Weight = Number(weight);
    }
    try {
      await fetch('/api/workouts/simple', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: today, exercise }) });
      triggerParticleAnimation();
      setMiles(''); setTime(''); setSets(''); setReps(''); setWeight(''); setOneRmValue('');
      onLogged();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {SIMPLE_CATEGORIES.map((c) => (
          <button key={c.name} onClick={() => setCat(c)}
            className={`mc-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded ${cat.name === c.name ? 'bg-[#22d3ee] text-[#0c0d10]' : 'bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {cat.name === 'Cardio' ? (
        <div className="grid grid-cols-3 gap-2">
          <select value={exerciseType} onChange={(e) => setExerciseType(e.target.value)} className={inputCls}>
            <option value="Jog">Jog</option><option value="Sprint">Sprint</option>
          </select>
          <input type="number" step="0.1" value={miles} onChange={(e) => setMiles(e.target.value)} placeholder="miles" className={inputCls} />
          <input type="number" value={time} onChange={(e) => setTime(e.target.value)} placeholder="minutes" className={inputCls} />
        </div>
      ) : cat.name === '1RM' ? (
        <div className="grid grid-cols-2 gap-2">
          <select value={oneRmExercise} onChange={(e) => setOneRmExercise(e.target.value)} className={inputCls}>
            {['Bench', 'Squat', 'Deadlift', 'Pull-Ups', '5k'].map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <input type="number" step={oneRmExercise === '5k' ? '0.1' : '1'} value={oneRmValue} onChange={(e) => setOneRmValue(e.target.value)} placeholder={oneRmExercise === '5k' ? 'minutes' : 'lbs'} className={inputCls} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <select value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} className={inputCls}>
            {cat.exercises.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          {cat.selector === 'intensity' && (
            <select value={intensity} onChange={(e) => setIntensity(e.target.value)} className={inputCls}>
              <option value="Heavy">Heavy</option><option value="Light">Light</option>
            </select>
          )}
        </div>
      )}

      {cat.name !== '1RM' && (
        <div className="grid grid-cols-3 gap-2">
          <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} placeholder="sets" className={inputCls} />
          <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="reps" className={inputCls} />
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="weight" className={inputCls} />
        </div>
      )}

      <button onClick={add} disabled={saving || (cat.name === '1RM' && !oneRmValue)}
        className="w-full mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-[#22d3ee]/20 border border-[#22d3ee] text-[#22d3ee] hover:bg-[#22d3ee]/30 disabled:opacity-50">
        {saving ? 'Adding…' : cat.name === '1RM' ? 'Log 1RM' : 'Add'}
      </button>
    </div>
  );
}
