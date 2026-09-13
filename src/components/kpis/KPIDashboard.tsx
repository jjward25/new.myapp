"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { DepthBust } from "./DepthBust";

interface KPIData {
  miles: { thisWeek: number; lastWeek: number; goal: number; source: string };
  tasksCompleted: { thisWeek: number; lastWeek: number };
  openTasksDue: { thisWeek: number; lastWeek: number; p0: number; p1: number; p2plus: number; overdue: number };
  events: { thisWeek: number; lastWeek: number; next: { title: string; date: string } | null };
}

export function refreshKPIs() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("kpi-refresh"));
  }
}

function useCountUp(value: number, ms = 650) {
  const [n, setN] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      prev.current = value;
      return;
    }
    const from = prev.current;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else prev.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return n;
}

const WoW: React.FC<{ current: number; previous: number; unit?: string; invert?: boolean }> = ({
  current,
  previous,
  unit = "",
  invert = false,
}) => {
  const delta = Math.round((current - previous) * 100) / 100;
  if (delta === 0) return <span className="mc-mono text-[10px] text-[#5b626d]">±0</span>;
  const up = delta > 0;
  const good = invert ? !up : up;
  return (
    <span className={`mc-mono text-[10px] ${good ? "text-[#35c48b]" : "text-[#f0426a]"}`}>
      {up ? "▲" : "▼"} {Math.abs(delta)}
      {unit}
    </span>
  );
};

// Two-limb running pictogram. `pct` (0-100+) sets stride speed — faster as
// the weekly goal is approached — and recolors in tiers: flat accent below
// 50%, a yellow->green gradient from 50-99%, and a flickering flame past 100%.
const Runner: React.FC<{ pct: number; color: string }> = ({ pct, color }) => {
  const gradId = React.useId().replace(/:/g, "");
  const clamped = Math.max(0, Math.min(pct, 130));
  const dur = 1.15 - (clamped / 130) * 0.75; // 1.15s jog -> 0.4s sprint

  const tier = pct >= 100 ? "hot" : pct >= 50 ? "mid" : "low";
  const stroke = tier === "low" ? color : `url(#${gradId})`;

  return (
    <svg
      viewBox="0 0 40 40"
      width="34"
      height="34"
      className={`mc-runner shrink-0${tier === "hot" ? " flame" : ""}`}
      style={{ "--run-dur": `${dur.toFixed(2)}s` } as React.CSSProperties}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          {tier === "hot" ? (
            <>
              <stop offset="0%" stopColor="#f0426a" />
              <stop offset="45%" stopColor="#ff7a18" />
              <stop offset="100%" stopColor="#ffe066" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#f5a623" />
              <stop offset="100%" stopColor="#35c48b" />
            </>
          )}
        </linearGradient>
      </defs>
      <g className="mc-runner-bob" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round">
        <circle cx="24" cy="8" r="3" fill={stroke} stroke="none" />
        <path d="M22 11 L18 22" />
        <g className="mc-runner-swing-a" style={{ "--pivot": "22px 11px" } as React.CSSProperties}>
          <path d="M22 11 L26 17 L23 21" />
        </g>
        <g className="mc-runner-swing-b" style={{ "--pivot": "22px 11px" } as React.CSSProperties}>
          <path d="M22 11 L17 15 L19 19" />
        </g>
        <g className="mc-runner-swing-a" style={{ "--pivot": "18px 22px" } as React.CSSProperties}>
          <path d="M18 22 L23 26 L22 33" />
        </g>
        <g className="mc-runner-swing-b" style={{ "--pivot": "18px 22px" } as React.CSSProperties}>
          <path d="M18 22 L14 27 L16 33" />
        </g>
      </g>
    </svg>
  );
};

type FigureVariant = "mozart" | "davinci" | "tesla" | "edison" | "franklin";

// Tasks-done milestone tiers -- unlocks a figure at each threshold, stays
// unlocked through the next tier's start (see submitMiles-adjacent note in
// chat: 3=Mozart, 4-5=da Vinci, 6-7=Tesla, 8-9=Edison, 10+=Franklin).
const figureForCount = (n: number): FigureVariant | null => {
  if (n >= 10) return "franklin";
  if (n >= 8) return "edison";
  if (n >= 6) return "tesla";
  if (n >= 4) return "davinci";
  if (n >= 3) return "mozart";
  return null;
};

const Card: React.FC<{ label: string; accent: string; children: React.ReactNode }> = ({
  label,
  accent,
  children,
}) => (
  <div
    className="mc-panel mc-kpi-card p-3.5 flex flex-col gap-2"
    style={{ "--kpi-accent": accent } as React.CSSProperties}
  >
    <div className="mc-kpi-label">{label}</div>
    {children}
  </div>
);

const KPIDashboard: React.FC = () => {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = useCallback(async () => {
    try {
      const r = await fetch("/api/kpis");
      if (!r.ok) throw new Error("kpi fetch failed");
      setData(await r.json());
    } catch (e) {
      console.error("Error fetching KPIs:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);
  useEffect(() => {
    const h = () => fetchKPIs();
    window.addEventListener("kpi-refresh", h);
    return () => window.removeEventListener("kpi-refresh", h);
  }, [fetchKPIs]);

  const [editingMiles, setEditingMiles] = useState(false);
  const [milesInput, setMilesInput] = useState("");
  const milesInputRef = useRef<HTMLInputElement>(null);
  const milesEditRef = useRef<HTMLDivElement>(null);

  const submitMiles = useCallback(async (raw?: string) => {
    const n = Number((raw ?? milesInputRef.current?.value ?? "").trim());
    setEditingMiles(false);
    if (!Number.isFinite(n) || n < 0) return;
    // Update on-screen immediately rather than waiting on the refetch
    // round-trip — the POST below reconciles the real source of truth
    // right after.
    setData((d) => (d ? { ...d, miles: { ...d.miles, thisWeek: n, source: "manual" } } : d));
    try {
      await fetch("/api/kpis/miles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ miles: n }),
      });
      refreshKPIs();
    } catch (e) {
      console.error("Error setting miles:", e);
    }
  }, []);

  useEffect(() => {
    if (!editingMiles) return;
    milesInputRef.current?.focus();
    milesInputRef.current?.select();
    // Native blur can be unreliable here (e.g. clicking a non-focusable
    // sibling), so save explicitly on any click outside the input instead
    // of relying on it.
    const onOutside = (e: MouseEvent) => {
      if (milesEditRef.current && !milesEditRef.current.contains(e.target as Node)) {
        submitMiles();
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [editingMiles, submitMiles]);

  const miles = useCountUp(data?.miles.thisWeek ?? 0);
  const done = useCountUp(data?.tasksCompleted.thisWeek ?? 0);
  const openDue = useCountUp(data?.openTasksDue.thisWeek ?? 0);
  const events = useCountUp(data?.events.thisWeek ?? 0);

  if (loading || !data) {
    return (
      <div className="mc grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mc-panel h-[92px] animate-pulse" />
        ))}
      </div>
    );
  }

  const milesPct = Math.min((data.miles.thisWeek / data.miles.goal) * 100, 100);
  const od = data.openTasksDue;
  const odTotal = Math.max(od.p0 + od.p1 + od.p2plus, 1);

  return (
    <div className="mc grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full mc-stagger">
      {/* Miles */}
      <Card label="Miles run · wk" accent="#22d3ee">
        <div className="flex items-baseline gap-1.5">
          {editingMiles ? (
            <div ref={milesEditRef} className="inline-flex">
              <input
                ref={milesInputRef}
                type="text"
                inputMode="decimal"
                defaultValue={data.miles.thisWeek}
                onChange={(e) => setMilesInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitMiles(e.currentTarget.value);
                  if (e.key === "Escape") setEditingMiles(false);
                }}
                style={{ width: `${Math.max(milesInput.length, 2) + 1}ch` }}
                className="mc-kpi-value text-4xl bg-transparent border-b border-[#22d3ee] outline-none"
              />
            </div>
          ) : (
            <button
              onClick={() => {
                setMilesInput(String(data.miles.thisWeek));
                setEditingMiles(true);
              }}
              className="mc-kpi-value text-4xl hover:text-[#22d3ee] transition-colors"
              title="Click to set this week's miles"
            >
              {miles.toFixed(1)}
            </button>
          )}
          <span className="mc-mono text-[10px] text-[#5b626d]">/ {data.miles.goal}</span>
          <span className="ml-auto">
            <WoW current={data.miles.thisWeek} previous={data.miles.lastWeek} unit="mi" />
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${milesPct}%`, background: milesPct >= 100 ? "#35c48b" : "#22d3ee" }}
            />
          </div>
          <Runner pct={milesPct} color="#22d3ee" />
        </div>
        {data.miles.source === "workouts" && (
          <span className="mc-mono text-[9px] text-[#5b626d]">from logged cardio</span>
        )}
        {data.miles.source === "manual" && (
          <span className="mc-mono text-[9px] text-[#5b626d]">manually set — click to edit</span>
        )}
      </Card>

      {/* Tasks completed */}
      <Card label="Tasks done · wk" accent="#35c48b">
        <div className="flex items-baseline gap-1.5">
          <span className="mc-kpi-value text-4xl">{Math.round(done)}</span>
          <span className="ml-auto">
            <WoW current={data.tasksCompleted.thisWeek} previous={data.tasksCompleted.lastWeek} />
          </span>
        </div>
        <div className="flex items-center">
          <span className="mc-mono text-[10px] text-[#5b626d]">last wk {data.tasksCompleted.lastWeek}</span>
          {figureForCount(data.tasksCompleted.thisWeek) && (
            <span className="ml-auto">
              <DepthBust name={figureForCount(data.tasksCompleted.thisWeek)!} size={64} />
            </span>
          )}
        </div>
      </Card>

      {/* Open due this week */}
      <Card label="Open · due this wk" accent={od.overdue > 0 ? "#f0426a" : "#f5a623"}>
        <div className="flex items-baseline gap-1.5">
          <span className="mc-kpi-value text-4xl">{Math.round(openDue)}</span>
          {od.overdue > 0 && (
            <span className="mc-mono text-[10px] text-[#f0426a]">{od.overdue} late</span>
          )}
          <span className="ml-auto">
            <WoW current={od.thisWeek} previous={od.lastWeek} invert />
          </span>
        </div>
        <div className="flex h-1 rounded-full overflow-hidden bg-white/5">
          {od.p0 > 0 && <div style={{ width: `${(od.p0 / odTotal) * 100}%`, background: "#f0426a" }} />}
          {od.p1 > 0 && <div style={{ width: `${(od.p1 / odTotal) * 100}%`, background: "#f5a623" }} />}
          {od.p2plus > 0 && <div style={{ width: `${(od.p2plus / odTotal) * 100}%`, background: "#35c48b" }} />}
        </div>
      </Card>

      {/* Events */}
      <Card label="Events · wk" accent="#a78bfa">
        <div className="flex items-baseline gap-1.5">
          <span className="mc-kpi-value text-4xl">{Math.round(events)}</span>
          <span className="ml-auto">
            <WoW current={data.events.thisWeek} previous={data.events.lastWeek} />
          </span>
        </div>
        <div className="mc-mono text-[10px] text-[#5b626d] truncate">
          {data.events.next ? `next · ${data.events.next.title}` : "nothing upcoming"}
        </div>
      </Card>
    </div>
  );
};

export default KPIDashboard;
