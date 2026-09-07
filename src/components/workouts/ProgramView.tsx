"use client";

import React from "react";
import {
  mission,
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

function Manifesto() {
  return (
    <section className="baddie-spread baddie-manifesto">
      <span className="baddie-numeral" aria-hidden="true">01</span>
      <div className="field" aria-hidden="true" />
      <div className="baddie-wrap inner">
        <p className="baddie-kicker baddie-reveal">
          One body <span className="sep">·</span> maximum productive dose <span className="sep">·</span> zero shame
        </p>
        <p className="baddie-thesis baddie-reveal">
          A body that folds in half, holds any position <em>as long as it wants to</em>, and looks obscene doing it.
        </p>
        <ol className="baddie-mantra baddie-reveal">
          {mantra.map((m, i) => (
            <li key={m}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {m}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TheStandard() {
  return (
    <section className="baddie-spread">
      <span className="baddie-numeral" aria-hidden="true">02</span>
      <div className="baddie-wrap">
        <p className="baddie-kicker">The bar to clear</p>
        <h2 className="baddie-display">
          <span className="baddie-mis" data-t="The Standard">The Standard</span>
        </h2>
        <p className="baddie-lede">
          Not how it photographs — what it can do under load and how far it opens. The splits are a deadline, not a
          someday. Retested every four to six weeks.
        </p>
        <div className="baddie-bench">
          {benchmarks.map((b: any) => (
            <div className={`baddie-bench-row${b.hit ? " hit" : ""}`} key={b.name}>
              <div className="name">{b.name}</div>
              <div className="now">now {b.now}</div>
              <div>
                <div className="bar">
                  <div className="fill" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="target">{b.target}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Rider() {
  return (
    <div className="baddie-rider">
      <svg viewBox="0 0 260 200" role="img" aria-label="Figure riding a stationary bike">
        <line className="road" x1="12" y1="182" x2="248" y2="182" />
        <circle className="frame" cx="78" cy="150" r="24" />
        <circle className="frame" cx="182" cy="150" r="24" />
        <path className="frame" d="M78 150 L128 150 L150 96 M128 150 L182 150 M150 96 L120 96 M150 96 L150 82" />
        <line className="frame" x1="150" y1="82" x2="150" y2="70" />
        <path className="body" d="M120 96 C124 74 132 60 140 52 L156 40" />
        <circle className="body" cx="160" cy="34" r="9" fill="var(--ground)" />
        <path className="body" d="M140 52 L112 68 M140 52 L120 96" />
        <line className="crank" x1="128" y1="150" x2="146" y2="132" />
        <line className="crank" x1="128" y1="150" x2="110" y2="168" />
        <path className="body" d="M146 132 L150 108 M110 168 L118 140" />
      </svg>
      <div className="cap">She rides as you scroll ↓</div>
    </div>
  );
}

function TheCycle() {
  const cls = ["establish", "push", "deload"];
  return (
    <section className="baddie-spread">
      <span className="baddie-numeral" aria-hidden="true">03</span>
      <div className="baddie-wrap">
        <div className="baddie-grid">
          <div style={{ gridColumn: "1 / 10" }}>
            <p className="baddie-kicker">Six weeks, then again, harder</p>
            <h2 className="baddie-display">
              <span className="baddie-mis" data-t="The Cycle">The Cycle</span>
            </h2>
          </div>
          <blockquote className="baddie-pull" style={{ gridColumn: "10 / 13", alignSelf: "start" }}>
            {cyclePull}
          </blockquote>
        </div>

        <div className="baddie-cyclelayout">
          <Rider />
          <div className="baddie-phases">
            {periodization.map((p, i) => (
              <div className={`baddie-phase ${cls[i]}`} key={p.name}>
                <div className="wk">{p.phase}</div>
                <h3>{p.name[0] + p.name.slice(1).toLowerCase()}</h3>
                <p>{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TheWeek() {
  return (
    <section className="baddie-spread">
      <span className="baddie-numeral" aria-hidden="true">04</span>
      <div className="baddie-wrap">
        <p className="baddie-kicker">
          Mon deep <span className="sep">·</span> Wed squeeze <span className="sep">·</span> Fri every angle{" "}
          <span className="sep">·</span> Sat sprint <span className="sep">·</span> Sun stay in one piece
        </p>
        <h2 className="baddie-display">
          <span className="baddie-mis" data-t="The Week">The Week</span>
        </h2>

        {week.map((day) => (
          <div className="baddie-day" key={day.id} style={{ ["--day" as any]: day.accent }}>
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
      </div>
    </section>
  );
}

function TheBodyMap() {
  return (
    <section className="baddie-spread">
      <span className="baddie-numeral" aria-hidden="true">05</span>
      <div className="baddie-wrap">
        <p className="baddie-kicker">
          What got worked <span className="sep">·</span> this week
        </p>
        <h2 className="baddie-display">
          <span className="baddie-mis" data-t="The Body Map">The Body Map</span>
        </h2>
        <p className="baddie-lede">
          Every muscle, colored by how hard you used it this issue. Cold means it&apos;s been getting away with something.
        </p>

        <div className="baddie-maplayout">
          <div className="baddie-figstage">
            <svg viewBox="0 0 150 320" role="img" aria-label="Body heatmap, front view — placeholder figure">
              <path
                className="figbase"
                d="M75 14 c9 0 15 7 15 16 c0 7 -3 12 -6 15 c6 3 11 8 13 17 l6 33 c1 6 -1 10 -5 11 l-4 -1 l-3 -24 l-2 40 c3 22 6 40 5 66 c0 10 -2 26 -4 40 c-1 8 -9 8 -10 0 l-4 -46 l-4 46 c-1 8 -9 8 -10 0 c-2 -14 -4 -30 -4 -40 c-1 -26 2 -44 5 -66 l-2 -40 l-3 24 l-4 1 c-4 -1 -6 -5 -5 -11 l6 -33 c2 -9 7 -14 13 -17 c-3 -3 -6 -8 -6 -15 c0 -9 6 -16 15 -16 z"
              />
              <path d="M55 63 c-6 1 -10 5 -12 12 c5 -4 10 -6 15 -6 z" fill="var(--heat-1)" opacity="0.85" />
              <path d="M95 63 c6 1 10 5 12 12 c-5 -4 -10 -6 -15 -6 z" fill="var(--heat-1)" opacity="0.85" />
              <path d="M62 70 c8 -4 18 -4 26 0 c1 8 -2 15 -13 16 c-11 -1 -14 -8 -13 -16 z" fill="var(--heat-0)" opacity="0.7" />
              <rect x="66" y="92" width="18" height="34" rx="4" fill="var(--heat-1)" opacity="0.8" />
              <path d="M63 170 c4 26 6 40 5 58 c-8 -2 -13 -6 -14 -18 c-1 -16 3 -30 9 -40 z" fill="var(--heat-3)" opacity="0.92" />
              <path d="M87 170 c-4 26 -6 40 -5 58 c8 -2 13 -6 14 -18 c1 -16 -3 -30 -9 -40 z" fill="var(--heat-3)" opacity="0.92" />
              <path d="M60 244 c-2 14 -1 26 2 36 c-6 -1 -9 -6 -10 -16 c-1 -8 3 -16 8 -20 z" fill="var(--heat-2)" opacity="0.9" />
              <path d="M90 244 c2 14 1 26 -2 36 c6 -1 9 -6 10 -16 c1 -8 -3 -16 -8 -20 z" fill="var(--heat-2)" opacity="0.9" />
            </svg>
          </div>
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

        <p className="baddie-note">
          <b>Placeholder figure.</b> Ships first as flat SVG so the feature is live. Real version: a rotatable in-browser
          3D figure from a free base mesh, ~16 muscle regions colored by weekly training volume off the log —
          MuscleWiki-style, skin on.
        </p>
      </div>
    </section>
  );
}

function TheMatrix() {
  return (
    <section className="baddie-spread">
      <span className="baddie-numeral" aria-hidden="true">06</span>
      <div className="baddie-wrap">
        <p className="baddie-kicker">Every quality, every region</p>
        <h2 className="baddie-display">
          <span className="baddie-mis" data-t="The Matrix">The Matrix</span>
        </h2>
        <p className="baddie-lede">{designMatrix.note}</p>
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
      </div>
    </section>
  );
}

function Nighttime() {
  return (
    <section className="baddie-spread">
      <span className="baddie-numeral" aria-hidden="true">07</span>
      <div className="baddie-wrap">
        <p className="baddie-kicker">Pretty, passive, productive</p>
        <h2 className="baddie-display">
          <span className="baddie-mis" data-t="Nighttime">Nighttime</span>
        </h2>
        <p className="baddie-lede">{eveningRecovery.frame}</p>
        <ul className="baddie-exlist" style={{ marginTop: 20, borderTop: "1px solid var(--line)" }}>
          {eveningRecovery.items.map((it) => (
            <li className="baddie-exrow" key={it.name}>
              <span className="exname">{it.name}</span>
              <span className="exdose">{it.dose}</span>
              <span className="exwhy">{it.purpose}</span>
            </li>
          ))}
        </ul>
        <p className="baddie-note" style={{ marginTop: 30 }}>
          Source doc updated {PROGRAM_UPDATED} · mirrored from PersonalAgent.fitness_program
        </p>
      </div>
    </section>
  );
}

export default function ProgramView() {
  return (
    <div>
      <Manifesto />
      <TheStandard />
      <TheCycle />
      <TheWeek />
      <TheBodyMap />
      <TheMatrix />
      <Nighttime />
    </div>
  );
}
