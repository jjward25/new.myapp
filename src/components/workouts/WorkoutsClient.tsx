"use client";

import React, { useState } from "react";
import ProgramView from "./ProgramView";
import WorkoutTracker from "./WorkoutTracker";
import WorkoutProgressionChart from "./WorkoutProgressionChart";
import PastWorkoutsSection from "./PastWorkoutsSection";

type TabId = "program" | "log" | "progress" | "history";

const TABS: { id: TabId; label: string }[] = [
  { id: "program", label: "The Program" },
  { id: "log", label: "Log It" },
  { id: "progress", label: "The Numbers" },
  { id: "history", label: "The Receipts" },
];

export default function WorkoutsClient({ workouts }: { workouts: any[] }) {
  const [tab, setTab] = useState<TabId>("program");

  return (
    <div className="baddie">
      <div className="baddie-folio">
        Joe&nbsp;—&nbsp;<b>Vol. 04</b>&nbsp;—&nbsp;Push
      </div>

      <header className="baddie-masthead">
        <div className="baddie-wrap row">
          <h1 className="baddie-wordmark">
            SLUT<span className="dot">.</span>
          </h1>
          <div className="baddie-mast-meta">
            A training publication
            <br />
            <b>Issue 04</b> · week 4 of 6 · phase: push
            <br />
            for girls who work their ass off. literally.
          </div>
        </div>
      </header>

      <div className="baddie-wrap">
        <nav className="baddie-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={t.id === tab ? "is-active" : ""} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "program" && <ProgramView />}

      {tab === "log" && (
        <section className="baddie-spread">
          <div className="baddie-wrap">
            <p className="baddie-kicker">Pick a day, fill in the sets</p>
            <h2 className="baddie-display">Log It</h2>
            <div className="baddie-embed">
              <WorkoutTracker />
            </div>
          </div>
        </section>
      )}

      {tab === "progress" && (
        <section className="baddie-spread">
          <div className="baddie-wrap">
            <p className="baddie-kicker">Weight &amp; reps over time</p>
            <h2 className="baddie-display">The Numbers</h2>
            <div className="baddie-embed">
              <WorkoutProgressionChart />
            </div>
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className="baddie-spread">
          <div className="baddie-wrap">
            <p className="baddie-kicker">Every session, logged</p>
            <h2 className="baddie-display">The Receipts</h2>
            <div className="baddie-embed">
              <PastWorkoutsSection workouts={workouts} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
