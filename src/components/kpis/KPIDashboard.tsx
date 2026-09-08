"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

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

const Card: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mc-panel p-3.5 flex flex-col gap-2">
    <div className="mc-label">{label}</div>
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
      <Card label="Miles run · wk">
        <div className="flex items-baseline gap-1.5">
          <span className="mc-mono text-2xl text-[#e7eaee]">{miles.toFixed(1)}</span>
          <span className="mc-mono text-[10px] text-[#5b626d]">/ {data.miles.goal}</span>
          <span className="ml-auto">
            <WoW current={data.miles.thisWeek} previous={data.miles.lastWeek} unit="mi" />
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${milesPct}%`, background: milesPct >= 100 ? "#35c48b" : "#22d3ee" }}
          />
        </div>
        {data.miles.source !== "strava" && (
          <a href="/api/strava/connect" className="mc-mono text-[9px] text-[#0e7490] hover:text-[#22d3ee]">
            connect strava →
          </a>
        )}
      </Card>

      {/* Tasks completed */}
      <Card label="Tasks done · wk">
        <div className="flex items-baseline gap-1.5">
          <span className="mc-mono text-2xl text-[#e7eaee]">{Math.round(done)}</span>
          <span className="ml-auto">
            <WoW current={data.tasksCompleted.thisWeek} previous={data.tasksCompleted.lastWeek} />
          </span>
        </div>
        <div className="mc-mono text-[10px] text-[#5b626d]">last wk {data.tasksCompleted.lastWeek}</div>
      </Card>

      {/* Open due this week */}
      <Card label="Open · due this wk">
        <div className="flex items-baseline gap-1.5">
          <span className="mc-mono text-2xl text-[#e7eaee]">{Math.round(openDue)}</span>
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
      <Card label="Events · wk">
        <div className="flex items-baseline gap-1.5">
          <span className="mc-mono text-2xl text-[#e7eaee]">{Math.round(events)}</span>
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
