"use client";

import React, { useEffect, useState } from "react";
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

function useSparkleTrail() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const glyphs = ["✦", "✧", "✩", "ᐧ"];
    const colors = ["#FF3D9A", "#B98CFF", "#57C7FF", "#C9FF3D"];
    let last = 0;
    const onMove = (e: PointerEvent) => {
      const t = Date.now();
      if (t - last < 45) return;
      last = t;
      const s = document.createElement("div");
      s.className = "baddie-trail";
      s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
      s.style.left = e.clientX + "px";
      s.style.top = e.clientY + "px";
      s.style.color = colors[(Math.random() * colors.length) | 0];
      document.body.appendChild(s);
      const dx = Math.random() * 24 - 12;
      const dy = Math.random() * -30 - 6;
      s.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: 0 },
        ],
        { duration: 700, easing: "cubic-bezier(.2,.7,.2,1)" }
      ).onfinish = () => s.remove();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
}

function useChromeTint() {
  useEffect(() => {
    document.body.dataset.route = "baddie";
    return () => {
      delete document.body.dataset.route;
    };
  }, []);
}

export default function WorkoutsClient({ workouts }: { workouts: any[] }) {
  const [tab, setTab] = useState<TabId>("program");
  useSparkleTrail();
  useChromeTint();

  return (
    <div className="baddie">
      <div className="baddie-wrap">
        <div className="baddie-folio">
          Joe <span>·</span> <b>Issue 04</b> <span>·</span> Week 4 of 6 <span>·</span> Phase: Push
        </div>

        <header className="baddie-masthead">
          <span className="baddie-spark" style={{ left: "7%", top: 18, fontSize: 24 }}>
            ✦
          </span>
          <span className="baddie-spark" style={{ right: "9%", top: 6, fontSize: 18, animationDelay: ".6s" }}>
            ✧
          </span>
          <span className="baddie-spark" style={{ right: "24%", bottom: 8, fontSize: 20, animationDelay: ".3s" }}>
            ✧
          </span>
          <h1 className="baddie-wordmark">
            SLUT<span>.</span>
          </h1>
          <div className="baddie-tagline">for girls who work their ass off — literally 🍑</div>
        </header>

        <nav className="baddie-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={t.id === tab ? "is-active" : ""} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="baddie-wrap">
        {tab === "program" && <ProgramView />}

        {tab === "log" && (
          <section className="baddie-spread">
            <span className="baddie-eyebrow">Pick a day, fill in the sets</span>
            <h2 className="baddie-h2">Log It</h2>
            <div className="baddie-sticker baddie-embed">
              <div className="embed-inner">
                <WorkoutTracker />
              </div>
            </div>
          </section>
        )}

        {tab === "progress" && (
          <section className="baddie-spread">
            <span className="baddie-eyebrow">Weight &amp; reps over time</span>
            <h2 className="baddie-h2">The Numbers</h2>
            <div className="baddie-sticker baddie-embed">
              <div className="embed-inner">
                <WorkoutProgressionChart />
              </div>
            </div>
          </section>
        )}

        {tab === "history" && (
          <section className="baddie-spread">
            <span className="baddie-eyebrow">Every session, logged</span>
            <h2 className="baddie-h2">The Receipts</h2>
            <div className="baddie-sticker baddie-embed">
              <div className="embed-inner">
                <PastWorkoutsSection workouts={workouts} />
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="baddie-footer">SLUT — Issue 04 · training funhouse</div>
    </div>
  );
}
