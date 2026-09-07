"use client";

import React from "react";
import {
  mantra,
  goalLegend,
  periodization,
  cyclePull,
  week,
  eveningRecovery,
  designMatrix,
  benchmarks,
  PROGRAM_UPDATED,
} from "@/data/fitnessProgram";

const emojiFor = (key: string) => goalLegend.find((x) => x.key === key)?.emoji || "";
const titleCase = (s: string) => s.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());

const Wave = () => (
  <svg className="baddie-wave" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 20 C 150 0 300 40 450 20 S 750 0 900 20 1200 30 1200 30 V40 H0 Z" />
  </svg>
);

function Manifesto() {
  return (
    <section className="baddie-spread">
      <span className="baddie-eyebrow">
        One body <span className="sep">·</span> maximum dose <span className="sep">·</span> zero shame
      </span>
      <p className="baddie-thesis">
        A body that folds in half, <span className="shine">holds any position</span> as long as it wants to, and looks
        obscene doing it.
      </p>
      <ul className="baddie-mantra">
        {mantra.map((m) => (
          <li key={m}>{titleCase(m)}</li>
        ))}
      </ul>
    </section>
  );
}

function TheStandard() {
  return (
    <section className="baddie-spread">
      <span className="baddie-eyebrow">The bar to clear</span>
      <h2 className="baddie-h2">The Standard</h2>
      <p className="baddie-lede">Not how it photographs — what it can do. The splits are a deadline, not a someday.</p>
      <div className="baddie-bench">
        {benchmarks.map((b: any) => (
          <div className={`baddie-sticker baddie-bench-card${b.hit ? " win" : ""}`} key={b.name}>
            <div className="row1">
              <h3>{b.name}</h3>
              <span className="now">now {b.now}</span>
            </div>
            <div className="baddie-meter">
              <i style={{ width: `${b.pct}%` }} />
            </div>
            <p className="baddie-dare">{b.target}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Bike() {
  return (
    <div className="baddie-sticker baddie-bikebox">
      <span className="baddie-spark" style={{ right: 14, top: 12, fontSize: 18 }}>
        ✧
      </span>
      <svg viewBox="0 0 300 210" role="img" aria-label="A babe pedaling a pink exercise bike">
        <line className="speed" x1="30" y1="60" x2="70" y2="60" />
        <line className="speed" x1="18" y1="92" x2="66" y2="92" style={{ animationDelay: ".15s" }} />
        <line className="speed" x1="30" y1="124" x2="72" y2="124" style={{ animationDelay: ".3s" }} />
        <circle className="wheel" cx="96" cy="160" r="34" />
        <circle className="wheel" cx="228" cy="160" r="34" />
        <g className="spin">
          <line className="spoke" x1="96" y1="128" x2="96" y2="192" />
          <line className="spoke" x1="66" y1="160" x2="126" y2="160" />
          <line className="spoke" x1="74" y1="138" x2="118" y2="182" />
          <line className="spoke" x1="74" y1="182" x2="118" y2="138" />
        </g>
        <path className="bikeframe" d="M96 160 L150 160 L182 96 M150 160 L228 160 M182 96 L150 96 M182 96 L196 74" />
        <line className="bikeframe" x1="196" y1="74" x2="196" y2="62" />
        <path
          className="babe-fill"
          d="M150 96 c14 -2 30 6 33 20 c2 12 -10 20 -24 18 c-14 -2 -22 -12 -20 -24 c1 -8 5 -12 11 -14 z"
        />
        <path className="babe" d="M150 96 C150 74 156 58 166 48" />
        <circle className="babe-fill" cx="172" cy="40" r="12" />
        <path className="babe" d="M166 48 L150 96 M166 48 L134 66" />
        <g className="leg pedalA">
          <path className="babe" d="M150 150 L150 116 M150 150 L128 168" />
        </g>
        <g className="leg pedalB">
          <path className="babe" d="M150 150 L172 132 M172 132 L156 112" />
        </g>
      </svg>
      <div className="baddie-assmeter">
        <div className="cap">
          <span>Glute volume · wk 4</span>
          <b>+72%</b>
        </div>
        <div className="track">
          <i />
        </div>
      </div>
    </div>
  );
}

function TheCycle() {
  const cls = ["", "p2", ""];
  return (
    <section className="baddie-spread">
      <span className="baddie-eyebrow">Six weeks, then again — harder</span>
      <h2 className="baddie-h2">The Cycle</h2>
      <p className="baddie-lede">{cyclePull}</p>
      <div className="baddie-cyclegrid">
        <Bike />
        <div className="baddie-phases">
          {periodization.map((p, i) => (
            <div className={`baddie-sticker baddie-phase ${cls[i]}`} key={p.name}>
              <div className="wk">{p.phase}</div>
              <h3>{p.name[0] + p.name.slice(1).toLowerCase()}</h3>
              <p>{p.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TheWeek() {
  return (
    <section className="baddie-spread">
      <span className="baddie-eyebrow">
        Mon deep <span className="sep">·</span> Wed squeeze <span className="sep">·</span> Fri every angle{" "}
        <span className="sep">·</span> Sat sprint <span className="sep">·</span> Sun stay in one piece
      </span>
      <h2 className="baddie-h2">The Week</h2>
      {week.map((day) => (
        <div className="baddie-sticker baddie-day" key={day.id} style={{ ["--day" as any]: day.accent }}>
          <div className="daytop">
            <span className="dlabel">{day.dayLabel}</span>
            <h3>{day.name}</h3>
            <span className="dtime">{day.time}</span>
          </div>
          <p className="dtheme">{day.theme}</p>
          <p className="dpayoff">{day.payoff}</p>
          {day.blocks.map((block, bi) => (
            <div className="baddie-blockrow" key={bi}>
              <div className="baddie-blocklabel">{block.label}</div>
              <ul className="baddie-exlist">
                {block.exercises.map((ex: any, ei: number) => (
                  <li className="baddie-exrow" key={ei}>
                    <span className="exname">{ex.name}</span>
                    <span className="exdose">{ex.dose}</span>
                    {ex.why && <span className="exwhy">{ex.why}</span>}
                    {ex.tags?.length ? (
                      <span className="extags">{ex.tags.map((t: string) => emojiFor(t)).join(" ")}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

function TheBodyMap() {
  return (
    <section className="baddie-spread">
      <span className="baddie-eyebrow">
        What got worked <span className="sep">·</span> this week
      </span>
      <h2 className="baddie-h2">The Body Map</h2>
      <p className="baddie-lede">
        Every muscle, colored by how hard you used it. Cold means it&apos;s been getting away with something.
      </p>
      <div className="baddie-maplayout">
        <div className="baddie-sticker baddie-figstage">
          <svg viewBox="0 0 150 320" role="img" aria-label="Body heatmap, front view — placeholder figure">
            <path
              className="figbase"
              d="M75 14 c9 0 15 7 15 16 c0 7 -3 12 -6 15 c6 3 11 8 13 17 l6 33 c1 6 -1 10 -5 11 l-4 -1 l-3 -24 l-2 40 c3 22 6 40 5 66 c0 10 -2 26 -4 40 c-1 8 -9 8 -10 0 l-4 -46 l-4 46 c-1 8 -9 8 -10 0 c-2 -14 -4 -30 -4 -40 c-1 -26 2 -44 5 -66 l-2 -40 l-3 24 l-4 1 c-4 -1 -6 -5 -5 -11 l6 -33 c2 -9 7 -14 13 -17 c-3 -3 -6 -8 -6 -15 c0 -9 6 -16 15 -16 z"
            />
            <rect x="66" y="92" width="18" height="34" rx="6" fill="var(--heat-1)" opacity="0.85" />
            <path d="M55 63 c-6 1 -10 5 -12 12 c5 -4 10 -6 15 -6 z" fill="var(--heat-1)" opacity="0.85" />
            <path d="M95 63 c6 1 10 5 12 12 c-5 -4 -10 -6 -15 -6 z" fill="var(--heat-1)" opacity="0.85" />
            <path d="M62 70 c8 -4 18 -4 26 0 c1 8 -2 15 -13 16 c-11 -1 -14 -8 -13 -16 z" fill="var(--heat-0)" opacity="0.75" />
            <path d="M63 170 c4 26 6 40 5 58 c-8 -2 -13 -6 -14 -18 c-1 -16 3 -30 9 -40 z" fill="var(--heat-3)" opacity="0.95" />
            <path d="M87 170 c-4 26 -6 40 -5 58 c8 -2 13 -6 14 -18 c1 -16 -3 -30 -9 -40 z" fill="var(--heat-3)" opacity="0.95" />
            <path d="M60 244 c-2 14 -1 26 2 36 c-6 -1 -9 -6 -10 -16 c-1 -8 3 -16 8 -20 z" fill="var(--heat-2)" opacity="0.9" />
            <path d="M90 244 c2 14 1 26 -2 36 c6 -1 9 -6 10 -16 c1 -8 -3 -16 -8 -20 z" fill="var(--heat-2)" opacity="0.9" />
          </svg>
        </div>
        <div className="baddie-sticker" style={{ padding: 20 }}>
          <div className="baddie-legend">
            <h4>Heat</h4>
            <div className="baddie-ramp" />
            <div className="baddie-ramp-labels">
              <span>Coasting</span>
              <span>Cooked</span>
            </div>
            <dl>
              <dt style={{ background: "var(--heat-3)" }} />
              <dd>
                <b>Quads</b> — 3 sessions, heavy
              </dd>
              <dt style={{ background: "var(--heat-2)" }} />
              <dd>
                <b>Calves</b> — 2 sessions
              </dd>
              <dt style={{ background: "var(--heat-1)" }} />
              <dd>
                <b>Delts, abs</b> — 1 session
              </dd>
              <dt style={{ background: "var(--heat-0)" }} />
              <dd>
                <b>Chest</b> — 6 days untouched
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <p className="baddie-note baddie-sticker">
        <b>Placeholder figure.</b> Ships first as flat SVG. Real version: a rotatable 3D figure from a free base mesh, ~16
        muscle regions colored by weekly training volume off the log — MuscleWiki-style, skin on.
      </p>
    </section>
  );
}

function TheMatrix() {
  return (
    <section className="baddie-spread">
      <span className="baddie-eyebrow">Every quality, every region</span>
      <h2 className="baddie-h2">The Matrix</h2>
      <p className="baddie-lede">{designMatrix.note}</p>
      <div className="baddie-sticker baddie-matrix">
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
    </section>
  );
}

function Nighttime() {
  return (
    <section className="baddie-spread">
      <span className="baddie-eyebrow">Pretty, passive, productive</span>
      <h2 className="baddie-h2">Nighttime</h2>
      <p className="baddie-lede">{eveningRecovery.frame}</p>
      <div className="baddie-sticker baddie-day">
        <ul className="baddie-exlist">
          {eveningRecovery.items.map((it) => (
            <li className="baddie-exrow" key={it.name}>
              <span className="exname">{it.name}</span>
              <span className="exdose">{it.dose}</span>
              <span className="exwhy">{it.purpose}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="baddie-note">Source doc updated {PROGRAM_UPDATED} · mirrored from PersonalAgent.fitness_program</p>
    </section>
  );
}

export default function ProgramView() {
  return (
    <div>
      <Manifesto />
      <Wave />
      <TheStandard />
      <Wave />
      <TheCycle />
      <Wave />
      <TheWeek />
      <Wave />
      <TheBodyMap />
      <Wave />
      <TheMatrix />
      <Wave />
      <Nighttime />
    </div>
  );
}
