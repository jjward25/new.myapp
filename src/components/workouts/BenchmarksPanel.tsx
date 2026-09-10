"use client";

import React, { useEffect, useState, useCallback } from 'react';

interface Benchmark {
  key: string;
  label: string;
  unit: string;
  direction: 'up' | 'down' | 'video';
  baseline: number | null;
  target: number | null;
  note: string;
  current: number | null;
  lastMeasured: string | null;
  history: { date: string; value: number | null; note?: string }[];
}

const RETEST_DAYS = 42; // 6 weeks

export default function BenchmarksPanel() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/benchmarks');
      setBenchmarks(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (key: string) => {
    await fetch('/api/benchmarks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: val === '' ? null : Number(val), note }),
    });
    setEditing(null); setVal(''); setNote('');
    load();
  };

  const dueForRetest = (b: Benchmark) => {
    if (!b.lastMeasured) return true;
    return (Date.now() - new Date(b.lastMeasured).getTime()) / 86_400_000 > RETEST_DAYS;
  };

  const progressPct = (b: Benchmark) => {
    if (b.direction === 'video' || b.current == null || b.baseline == null || b.target == null) return null;
    const span = Math.abs(b.baseline - b.target);
    if (!span) return 100;
    const done = Math.abs(b.baseline - b.current);
    return Math.max(0, Math.min(100, (done / span) * 100));
  };

  if (loading) {
    return <div className="mc-panel p-4"><p className="mc-mono text-[11px] text-[#8a919c]">Loading…</p></div>;
  }

  return (
    <div className="mc-panel p-4" style={{ background: '#171a1f', borderColor: 'rgba(255,255,255,0.14)' }}>
      <div className="mc-label mb-3">Mobility Benchmarks</div>
      <div className="space-y-2.5">
        {benchmarks.map((b) => {
          const pct = progressPct(b);
          const due = dueForRetest(b);
          return (
            <div key={b.key} className="border border-white/10 rounded bg-[#0c0d10] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[13px] text-[#e7eaee]">{b.label}</span>
                  {due && <span className="mc-mono text-[9px] uppercase tracking-widest text-[#f5a623] ml-2">retest due</span>}
                </div>
                <div className="mc-mono text-[12px] text-[#c4c9d1] shrink-0">
                  {b.current != null ? `${b.current}${b.unit === 'video' ? '' : ` ${b.unit.split(' ')[0]}`}` : '—'}
                  {b.target != null && <span className="text-[#5b626d]"> → {b.target}</span>}
                </div>
              </div>
              {pct != null && (
                <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-[#35c48b]" style={{ width: `${pct}%` }} />
                </div>
              )}
              {b.note && <p className="mc-mono text-[10px] text-[#5b626d] mt-1">{b.note}</p>}
              {editing === b.key ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type={b.unit === 'video' ? 'text' : 'number'}
                    step="0.5"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    placeholder={b.unit === 'video' ? 'video link / note' : b.unit}
                    className="flex-1 bg-[#0c0d10] border border-white/20 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
                  />
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note" className="w-24 bg-[#0c0d10] border border-white/20 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]" />
                  <button onClick={() => save(b.key)} className="mc-mono text-[10px] uppercase px-2 rounded bg-[#22d3ee]/20 border border-[#22d3ee] text-[#22d3ee]">save</button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditing(b.key); setVal(''); setNote(''); }}
                  className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] hover:text-[#22d3ee] mt-1.5"
                >
                  + measurement{b.lastMeasured ? ` · last ${b.lastMeasured.slice(5)}` : ''}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
