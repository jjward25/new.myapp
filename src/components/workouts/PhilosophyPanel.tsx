"use client";

import React, { useState } from "react";
import { periodization, cyclePull, effortArchitecture, benchmarks, endState, designMatrix, eveningRecovery } from "@/data/fitnessProgram";

export default function PhilosophyPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mc-panel" style={{ background: "#171a1f", borderColor: "rgba(255,255,255,0.14)" }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-4 py-2.5 text-left">
        <span className="mc-label">Philosophy</span>
        <span className="mc-mono text-[10px] text-[#5b626d]">the why, the rules, the targets</span>
        <svg
          className={`w-4 h-4 ml-auto text-[#5b626d] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-white/[0.08] pt-4">
          {/* The Cycle */}
          <div>
            <div className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] mb-1">The Cycle — {cyclePull}</div>
            <div className="grid md:grid-cols-3 gap-2">
              {periodization.map((p: any) => (
                <div key={p.name} className="border border-white/10 rounded bg-[#0c0d10] p-2.5">
                  <div className="mc-mono text-[9px] uppercase tracking-widest text-[#5b626d]">{p.phase}</div>
                  <div className="text-[13px] font-semibold text-[#22d3ee]">{p.name}</div>
                  <p className="text-[11px] text-[#c4c9d1] mt-1 leading-snug">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Effort architecture */}
          <div>
            <div className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] mb-1">Effort Architecture</div>
            <div className="flex flex-col gap-1.5">
              {effortArchitecture.map((e: any) => (
                <div key={e.kind} className="border border-white/10 rounded bg-[#0c0d10] p-2.5">
                  <span className="text-[12px] font-semibold text-[#e7eaee]">{e.kind}</span>
                  <span className="text-[11px] text-[#c4c9d1]"> — {e.rule}</span>
                  <p className="mc-mono text-[9px] text-[#5b626d] mt-1">{e.list}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nightly */}
          <div>
            <div className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] mb-1">Nightly Routine</div>
            <p className="text-[11px] text-[#c4c9d1]">{eveningRecovery.frame}</p>
          </div>

          {/* Benchmarks + end state */}
          <div>
            <div className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] mb-1">The Standard</div>
            <div className="grid md:grid-cols-2 gap-2 mb-3">
              {benchmarks.map((b: any) => (
                <div key={b.name} className="border border-white/10 rounded bg-[#0c0d10] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#e7eaee]">{b.name}</span>
                    <span className="mc-mono text-[10px] text-[#c4c9d1]">now {b.now}</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.hit ? "#35c48b" : "#22d3ee" }} />
                  </div>
                  <p className="text-[10px] text-[#8a919c] mt-1">{b.target}</p>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-1">
              {endState.map((e: any) => (
                <div key={e.text} className="text-[12px] text-[#c4c9d1]">
                  <span className="mr-1.5">{e.emoji}</span>{e.text}
                </div>
              ))}
            </div>
          </div>

          {/* Matrix */}
          <div>
            <div className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] mb-1">The Matrix</div>
            <p className="text-[11px] text-[#8a919c] mb-2">{designMatrix.note}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="mc-mono text-[9px] uppercase tracking-widest text-[#8a919c] py-1 pr-3">Region</th>
                    {designMatrix.columns.map((c: string) => (
                      <th key={c} className="mc-mono text-[9px] uppercase tracking-widest text-[#8a919c] py-1 pr-3 whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {designMatrix.rows.map((r: any) => (
                    <tr key={r.region} className="border-t border-white/[0.06]">
                      <td className="text-[11px] text-[#e7eaee] py-1 pr-3 whitespace-nowrap">{r.region}</td>
                      {r.cells.map((cell: string, i: number) => (
                        <td key={i} className="text-[10px] text-[#c4c9d1] py-1 pr-3">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
