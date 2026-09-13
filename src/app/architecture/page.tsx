"use client";

import React, { useMemo, useState } from "react";
import { roadmapItems, roadmapAreas, ROADMAP_UPDATED } from "@/data/roadmapStatus";
import { sides, GOVERNING_PRINCIPLE } from "@/data/architecture";

type Status = "done" | "in_progress" | "planned";
const COLUMNS: { status: Status; label: string; color: string }[] = [
  { status: "done", label: "Done", color: "#35c48b" },
  { status: "in_progress", label: "In Progress", color: "#f5a623" },
  { status: "planned", label: "Planned", color: "#8a919c" },
];

export default function ArchitecturePage() {
  const [area, setArea] = useState<string | null>(null);

  const filtered = useMemo(
    () => (area ? roadmapItems.filter((i) => i.area === area) : roadmapItems),
    [area]
  );

  const counts = useMemo(() => {
    const c: Record<Status, number> = { done: 0, in_progress: 0, planned: 0 };
    filtered.forEach((i) => c[i.status as Status]++);
    return c;
  }, [filtered]);

  return (
    <div className="mc min-h-screen bg-[#0c0d10] text-[#e7eaee]">
      <div className="w-full max-w-[1200px] mx-auto px-3 md:px-6 py-6 flex flex-col gap-6">
        <div>
          <h1 className="mc-mono text-lg tracking-[0.2em] text-[#e7eaee]">ARCHITECTURE</h1>
          <p className="mc-mono text-[11px] text-[#8a919c] mt-1">
            How Hermes and the webapp fit together, and what&apos;s actually left to build.
          </p>
        </div>

        {/* ---------------- Roadmap board ---------------- */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="mc-label">Roadmap</span>
            <span className="mc-mono text-[10px] text-[#5b626d]">updated {ROADMAP_UPDATED}</span>
            <div className="flex gap-1 ml-auto flex-wrap">
              <button
                onClick={() => setArea(null)}
                className={`mc-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                  area === null ? "bg-[#22d3ee] text-[#0c0d10]" : "bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]"
                }`}
              >
                All
              </button>
              {roadmapAreas.map((a) => (
                <button
                  key={a}
                  onClick={() => setArea(a)}
                  className={`mc-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                    area === a ? "bg-[#22d3ee] text-[#0c0d10]" : "bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {COLUMNS.map((col) => (
              <div key={col.status} className="mc-panel flex flex-col" style={{ background: "#171a1f", borderColor: "rgba(255,255,255,0.14)" }}>
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.08]">
                  <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="mc-mono text-[11px] uppercase tracking-widest text-[#e7eaee]">{col.label}</span>
                  <span className="mc-mono text-[11px] text-[#5b626d] ml-auto">{counts[col.status]}</span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[480px] px-3 py-2 flex flex-col gap-2">
                  {filtered
                    .filter((i) => i.status === col.status)
                    .map((i) => (
                      <div key={i.title} className="border border-white/10 rounded bg-[#0c0d10] p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] text-[#e7eaee]">{i.title}</span>
                          <span className="mc-mono text-[9px] uppercase tracking-widest text-[#5b626d] shrink-0">{i.area}</span>
                        </div>
                        {i.note && <p className="text-[11px] text-[#8a919c] mt-1 leading-snug">{i.note}</p>}
                      </div>
                    ))}
                  {filtered.filter((i) => i.status === col.status).length === 0 && (
                    <p className="mc-mono text-[11px] text-[#5b626d] italic py-4 text-center">nothing here</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Architecture breakdown ---------------- */}
        <section className="flex flex-col gap-3">
          <span className="mc-label">System Breakdown</span>
          <div className="mc-panel p-4" style={{ background: "#171a1f", borderColor: "rgba(255,255,255,0.14)" }}>
            <p className="text-[14px] text-[#e7eaee] leading-relaxed">{GOVERNING_PRINCIPLE}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {sides.map((side) => (
              <div key={side.key} className="mc-panel p-4" style={{ background: "#171a1f", borderColor: "rgba(255,255,255,0.14)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: side.accent }} />
                  <span className="mc-label" style={{ color: side.accent }}>{side.label}</span>
                </div>
                <p className="mc-mono text-[11px] text-[#8a919c] mb-3">{side.tagline}</p>
                <div className="flex flex-col gap-2">
                  {side.items.map((it) => (
                    <div key={it.name} className="border border-white/10 rounded bg-[#0c0d10] p-2.5">
                      <div className="text-[13px] font-semibold text-[#e7eaee]">{it.name}</div>
                      <p className="text-[12px] text-[#c4c9d1] mt-1 leading-snug">{it.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
