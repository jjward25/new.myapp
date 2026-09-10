"use client";

import React from "react";
import {
  mission,
  goalLegend,
  periodization,
  cyclePull,
  effortArchitecture,
  week,
  eveningRecovery,
  designMatrix,
  benchmarks,
  endState,
  PROGRAM_UPDATED,
} from "@/data/fitnessProgram";

const emojiFor = (key: string) => goalLegend.find((x: any) => x.key === key)?.emoji || "";

const Panel: React.FC<{ title: string; children: React.ReactNode; sub?: string }> = ({ title, children, sub }) => (
  <div className="mc-panel p-4" style={{ background: "#171a1f", borderColor: "rgba(255,255,255,0.14)" }}>
    <div className="mc-label mb-1">{title}</div>
    {sub && <p className="mc-mono text-[11px] text-[#8a919c] mb-3">{sub}</p>}
    {!sub && <div className="mb-3" />}
    {children}
  </div>
);

export default function ProgramView() {
  return (
    <div className="flex flex-col gap-4">
      {/* Mission */}
      <Panel title="Mission">
        <p className="text-[15px] text-[#e7eaee] leading-relaxed">{mission.headline}</p>
        <p className="text-[13px] text-[#c4c9d1] mt-2 leading-relaxed">{mission.body}</p>
        <p className="text-[12px] text-[#8a919c] mt-2 leading-relaxed">{mission.principle}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {goalLegend.map((g: any) => (
            <span key={g.key} className="mc-mono text-[10px] px-2 py-0.5 rounded border border-white/10 text-[#c4c9d1]">
              {g.emoji} {g.label}
            </span>
          ))}
        </div>
      </Panel>

      {/* Periodization */}
      <Panel title="The Cycle" sub={cyclePull}>
        <div className="grid md:grid-cols-3 gap-2">
          {periodization.map((p: any) => (
            <div key={p.name} className="border border-white/10 rounded bg-[#0c0d10] p-3">
              <div className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c]">{p.phase}</div>
              <div className="text-[14px] font-semibold text-[#22d3ee] mt-0.5">{p.name}</div>
              <p className="text-[12px] text-[#c4c9d1] mt-1.5 leading-relaxed">{p.detail}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Effort architecture */}
      <Panel title="Effort Architecture" sub="Maximum effort has different forms.">
        <div className="flex flex-col gap-2">
          {effortArchitecture.map((e: any) => (
            <div key={e.kind} className="border border-white/10 rounded bg-[#0c0d10] p-3">
              <div className="text-[13px] font-semibold text-[#e7eaee]">{e.kind}</div>
              <p className="text-[12px] text-[#c4c9d1] mt-1">{e.rule}</p>
              <p className="mc-mono text-[10px] text-[#5b626d] mt-1.5">{e.list}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* The week */}
      <Panel title="The Week" sub="Mon deep · Wed squeeze · Fri every angle · Sat sprint · Sun stay in one piece">
        <div className="flex flex-col gap-3">
          {week.map((day: any) => (
            <div key={day.id} className="border border-white/10 rounded bg-[#0c0d10] p-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="mc-mono text-[10px] uppercase tracking-widest text-[#22d3ee]">{day.dayLabel}</span>
                <span className="text-[14px] font-semibold text-[#e7eaee]">{day.name}</span>
                <span className="mc-mono text-[10px] text-[#5b626d] ml-auto">{day.time}</span>
              </div>
              <p className="mc-mono text-[10px] uppercase tracking-wide text-[#8a919c] mt-1">{day.theme}</p>
              <p className="text-[12px] text-[#c4c9d1] mt-1">{day.payoff}</p>
              {day.blocks.map((block: any, bi: number) => (
                <div key={bi} className="mt-2.5">
                  <div className="mc-mono text-[10px] uppercase tracking-widest text-[#5b626d] mb-1">{block.label}</div>
                  <div className="flex flex-col gap-1">
                    {block.exercises.map((ex: any, ei: number) => (
                      <div key={ei} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 py-1 border-b border-white/[0.05] last:border-0">
                        <span className="text-[13px] text-[#e7eaee]">
                          {ex.name}
                          {ex.tags?.length ? <span className="ml-1.5">{ex.tags.map((t: string) => emojiFor(t)).join("")}</span> : null}
                        </span>
                        <span className="mc-mono text-[11px] text-[#c4c9d1] text-right">{ex.dose}</span>
                        {ex.why && <span className="col-span-2 text-[11px] text-[#8a919c] leading-snug">{ex.why}</span>}
                        {ex.progression && <span className="col-span-2 mc-mono text-[10px] text-[#5b626d]">↗ {ex.progression}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Panel>

      {/* Benchmarks */}
      <Panel title="The Standard" sub="Not how it photographs — what it can do. The splits are a deadline, not a someday.">
        <div className="grid md:grid-cols-2 gap-2">
          {benchmarks.map((b: any) => (
            <div key={b.name} className="border border-white/10 rounded bg-[#0c0d10] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#e7eaee]">{b.name}</span>
                <span className="mc-mono text-[11px] text-[#c4c9d1]">now {b.now}</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.hit ? "#35c48b" : "#22d3ee" }} />
              </div>
              <p className="text-[11px] text-[#8a919c] mt-1.5">{b.target}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Evening recovery */}
      <Panel title="Nighttime" sub={eveningRecovery.frame}>
        <div className="flex flex-col gap-1">
          {eveningRecovery.items.map((it: any) => (
            <div key={it.name} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 py-1 border-b border-white/[0.05] last:border-0">
              <span className="text-[13px] text-[#e7eaee]">{it.name}</span>
              <span className="mc-mono text-[11px] text-[#c4c9d1] text-right">{it.dose}</span>
              <span className="col-span-2 text-[11px] text-[#8a919c] leading-snug">{it.purpose}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Matrix */}
      <Panel title="The Matrix" sub={designMatrix.note}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] py-1.5 pr-3">Region</th>
                {designMatrix.columns.map((c: string) => (
                  <th key={c} className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] py-1.5 pr-3 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {designMatrix.rows.map((r: any) => (
                <tr key={r.region} className="border-t border-white/[0.06]">
                  <td className="text-[12px] text-[#e7eaee] py-1.5 pr-3 whitespace-nowrap">{r.region}</td>
                  {r.cells.map((cell: string, i: number) => (
                    <td key={i} className="text-[11px] text-[#c4c9d1] py-1.5 pr-3">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* End state */}
      <Panel title="End State">
        <div className="grid md:grid-cols-2 gap-1.5">
          {endState.map((e: any) => (
            <div key={e.text} className="text-[13px] text-[#c4c9d1]">
              <span className="mr-1.5">{e.emoji}</span>{e.text}
            </div>
          ))}
        </div>
        <p className="mc-mono text-[10px] text-[#5b626d] mt-3">
          Source: PersonalAgent.fitness_program · updated {PROGRAM_UPDATED}
        </p>
      </Panel>
    </div>
  );
}
