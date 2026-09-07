"use client";

import React from "react";
import {
  mission,
  goalLegend,
  periodization,
  effortArchitecture,
  week,
  eveningRecovery,
  designMatrix,
  benchmarks,
  endState,
  PROGRAM_UPDATED,
} from "@/data/fitnessProgram";

const stripeFor = (tags: string[] = []) => {
  const g = goalLegend.find((x) => tags.includes(x.key));
  return g?.stripe || "var(--purple)";
};
const emojiFor = (key: string) => goalLegend.find((x) => x.key === key)?.emoji || "•";

export default function ProgramView() {
  return (
    <div>
      <div className="baddie-legend">
        {goalLegend.map((g) => (
          <span className="pill" key={g.key}>
            {g.emoji} {g.label}
          </span>
        ))}
      </div>

      {/* Mission */}
      <div className="baddie-sechead">
        <h2>The Mission</h2>
        <span>source doc updated {PROGRAM_UPDATED}</span>
      </div>
      <div className="baddie-card">
        <p style={{ font: "italic 700 19px/1.3 Georgia, serif", margin: "0 0 10px", color: "var(--pink)" }}>
          {mission.headline}
        </p>
        <p style={{ margin: "0 0 10px" }}>{mission.body}</p>
        <div className="baddie-note">{mission.principle}</div>
      </div>

      {/* Periodization */}
      <div className="baddie-sechead">
        <h2>The Cycle</h2>
        <span>6-week block, then repeat off what recovered</span>
      </div>
      <div className="baddie-phases">
        {periodization.map((p) => (
          <div className="baddie-phase" key={p.phase}>
            <div className="p">{p.phase}</div>
            <div className="n">{p.name}</div>
            <div className="d">{p.detail}</div>
          </div>
        ))}
      </div>

      {/* Effort architecture */}
      <div className="baddie-sechead">
        <h2>Effort, Three Ways</h2>
        <span>intensity ≠ treating every exercise the same</span>
      </div>
      <div className="baddie-chiprow">
        {effortArchitecture.map((e) => (
          <div className="baddie-chip" key={e.kind} style={{ textAlign: "left" }}>
            <b style={{ fontSize: 13 }}>{e.kind}</b>
            <div className="sub" style={{ marginTop: 6 }}>{e.rule}</div>
            <div className="sub" style={{ marginTop: 6, color: "var(--pink)", fontWeight: 700 }}>{e.list}</div>
          </div>
        ))}
      </div>

      {/* The week */}
      <div className="baddie-sechead">
        <h2>The Week</h2>
        <span>Mon stretch · Wed squeeze · Fri 360 · Sat speed · Sun durability</span>
      </div>
      {week.map((day) => (
        <div className="baddie-card baddie-day" key={day.id}>
          <div className="daytop">
            <h3>{day.name}</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="daylabel" style={{ background: day.accent }}>{day.dayLabel}</span>
              <span className="time">{day.time}</span>
            </div>
          </div>
          <p className="theme">{day.theme}</p>
          <p className="payoff">{day.payoff}</p>
          {day.blocks.map((block, bi) => (
            <div key={bi}>
              <div className="baddie-block">{block.label}</div>
              <div className="baddie-exgrid">
                {block.exercises.map((ex: any, ei: number) => (
                  <div className="baddie-ex" key={ei} style={{ ["--stripe" as any]: stripeFor(ex.tags) }}>
                    <h4>{ex.name}</h4>
                    <div className="dose">{ex.dose}</div>
                    {ex.why && <p className="why">{ex.why}</p>}
                    {ex.progression && (
                      <div className="prog">
                        <b>Progress:</b> {ex.progression}
                      </div>
                    )}
                    {ex.tags?.length ? (
                      <div className="tags">
                        {ex.tags.map((t: string) => (
                          <span className="tag" key={t} title={t}>
                            {emojiFor(t)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Evening recovery */}
      <div className="baddie-sechead">
        <h2>Nighttime Witchcraft</h2>
        <span>pretty, passive, productive</span>
      </div>
      <div className="baddie-card">
        <div className="baddie-note">{eveningRecovery.frame}</div>
        <div className="baddie-exgrid">
          {eveningRecovery.items.map((it) => (
            <div className="baddie-ex" key={it.name} style={{ ["--stripe" as any]: "var(--mint)" }}>
              <h4>{it.name}</h4>
              <div className="dose">{it.dose}</div>
              <p className="why">{it.purpose}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Design matrix */}
      <div className="baddie-sechead">
        <h2>The Design Matrix</h2>
        <span>all five columns covered? stop adding exercises</span>
      </div>
      <div className="baddie-matrix">
        <table>
          <thead>
            <tr>
              <th>Region</th>
              {designMatrix.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {designMatrix.rows.map((r) => (
              <tr key={r.region}>
                <td>{r.region}</td>
                {r.cells.map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="baddie-note" style={{ marginTop: 10 }}>{designMatrix.note}</div>

      {/* Benchmarks */}
      <div className="baddie-sechead">
        <h2>Benchmarks</h2>
        <span>retest every 4–6 weeks</span>
      </div>
      <div className="baddie-bench">
        {benchmarks.map((b) => (
          <div className="row" key={b.name}>
            <b>{b.name}</b>
            <span className="now">now: {b.now}</span>
            <span className="target">{b.target}</span>
          </div>
        ))}
      </div>

      {/* End state */}
      <div className="baddie-sechead">
        <h2>The End State</h2>
        <span>what &ldquo;done&rdquo; looks like</span>
      </div>
      <div className="baddie-chiprow">
        {endState.map((e) => (
          <div className="baddie-chip" key={e.text}>
            <div className="big">{e.emoji}</div>
            <b style={{ fontWeight: 650, fontSize: 11 }}>{e.text}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
