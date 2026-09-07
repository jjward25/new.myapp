"use client";

import React, { useState } from "react";
import ProgramView from "./ProgramView";
import WorkoutTracker from "./WorkoutTracker";
import WorkoutProgressionChart from "./WorkoutProgressionChart";
import PastWorkoutsSection from "./PastWorkoutsSection";
import { mantra } from "@/data/fitnessProgram";

type TabId = "program" | "log" | "progress" | "history";

const TABS: { id: TabId; label: string }[] = [
  { id: "program", label: "THE PROGRAM" },
  { id: "log", label: "LOG IT" },
  { id: "progress", label: "THE NUMBERS" },
  { id: "history", label: "THE RECEIPTS" },
];

export default function WorkoutsClient({ workouts }: { workouts: any[] }) {
  const [tab, setTab] = useState<TabId>("program");

  return (
    <div className="baddie">
      <div className="baddie-wrap">
        <section className="baddie-hero">
          <div className="baddie-kicker">THE BODY PROJECT</div>
          <h1>Full-Body Baddie</h1>
          <p>
            Glutes as the centerpiece. 360° hip range. Own the fold, grow the back, sprint like you mean it —
            maximum productive dose, every set earning its rent.
          </p>
          <div className="baddie-mantra">
            {mantra.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </section>

        <div className="baddie-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={t.id === tab ? "is-active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "program" && <ProgramView />}

        {tab === "log" && (
          <>
            <div className="baddie-sechead">
              <h2>Log It</h2>
              <span>pick a day, fill in the sets</span>
            </div>
            <div className="baddie-embed">
              <WorkoutTracker />
            </div>
          </>
        )}

        {tab === "progress" && (
          <>
            <div className="baddie-sechead">
              <h2>The Numbers</h2>
              <span>weight & reps over time</span>
            </div>
            <div className="baddie-embed">
              <WorkoutProgressionChart />
            </div>
          </>
        )}

        {tab === "history" && (
          <>
            <div className="baddie-sechead">
              <h2>The Receipts</h2>
              <span>every session logged</span>
            </div>
            <div className="baddie-embed">
              <PastWorkoutsSection workouts={workouts} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
