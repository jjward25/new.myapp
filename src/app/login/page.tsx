"use client";

import React, { useEffect, useMemo, useState } from "react";

interface IconDef {
  id: string;
  emoji: string;
  label: string;
  // Color shown as feedback when this icon is clicked in step 1. Every icon
  // gets one (including the "correct" one) so no icon behaves differently
  // from the others — the puzzle's answer is never inferable from the UI's
  // own behavior, only from knowing it in advance.
  color: string;
}

// 16 icons (4x4 grid) — widened from 9 on 2026-09-07 to raise the puzzle's
// combinatorial space (16 x 3! = 96 combinations, up from 54). Which one is
// "correct" and what color order follows it are never encoded here or
// anywhere else client-side — this component only ever reports back exactly
// what was clicked; the actual answer lives only in server env vars (see
// /api/login/route.js).
const ICONS: IconDef[] = [
  { id: "trafficlight", emoji: "🚦", label: "Traffic light", color: "#94a3b8" },
  { id: "wave", emoji: "🌊", label: "Wave", color: "#3b82f6" },
  { id: "grapes", emoji: "🍇", label: "Grapes", color: "#a855f7" },
  { id: "blossom", emoji: "🌸", label: "Blossom", color: "#ec4899" },
  { id: "moon", emoji: "🌙", label: "Moon", color: "#6366f1" },
  { id: "snowflake", emoji: "❄️", label: "Snowflake", color: "#06b6d4" },
  { id: "chocolate", emoji: "🍫", label: "Chocolate", color: "#92400e" },
  { id: "elephant", emoji: "🐘", label: "Elephant", color: "#6b7280" },
  { id: "butterfly", emoji: "🦋", label: "Butterfly", color: "#14b8a6" },
  { id: "galaxy", emoji: "🌌", label: "Galaxy", color: "#7c3aed" },
  { id: "unicorn", emoji: "🦄", label: "Unicorn", color: "#d946ef" },
  { id: "dolphin", emoji: "🐬", label: "Dolphin", color: "#0ea5e9" },
  { id: "candy", emoji: "🍬", label: "Candy", color: "#db2777" },
  { id: "rock", emoji: "🪨", label: "Rock", color: "#475569" },
  { id: "anchor", emoji: "⚓", label: "Anchor", color: "#1e3a8a" },
  { id: "balloon", emoji: "🎈", label: "Balloon", color: "#c026d3" },
];

const COLORS = [
  { id: "red", css: "#ef4444" },
  { id: "yellow", css: "#eab308" },
  { id: "green", css: "#22c55e" },
];

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function LoginPage() {
  const [grid, setGrid] = useState<IconDef[]>(ICONS);
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Choice, setStep1Choice] = useState<string | null>(null);
  const [step1Color, setStep1Color] = useState<string | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  // Emergency override — bypasses both lockouts (per-IP and the global
  // circuit breaker) via a separate, high-entropy secret, not the puzzle
  // itself. Answers "how do I get back in if the global breaker trips on
  // me too, not just an attacker."
  const [showOverride, setShowOverride] = useState(false);
  const [overrideInput, setOverrideInput] = useState("");

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/";
    return new URLSearchParams(window.location.search).get("next") || "/";
  }, []);

  useEffect(() => {
    setGrid(shuffled(ICONS));
  }, []);

  const reset = () => {
    setGrid(shuffled(ICONS));
    setStep(1);
    setStep1Choice(null);
    setStep1Color(null);
    setSequence([]);
  };

  const submitLogin = async (payload: object) => {
    setStatus("checking");
    setMessage(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        window.location.href = nextPath;
        return;
      }

      setStatus("error");
      setMessage(data?.error || "Incorrect — try again.");
      reset();
    } catch {
      setStatus("error");
      setMessage("Network error — try again.");
      reset();
    }
  };

  const handleIconClick = (icon: IconDef) => {
    if (status === "checking") return;
    setStep1Choice(icon.id);
    setStep1Color(icon.color);
    setStep(2);
  };

  const handleColorClick = (colorId: string) => {
    if (status === "checking") return;
    const nextSequence = [...sequence, colorId];
    setSequence(nextSequence);
    if (nextSequence.length < 3) return;
    submitLogin({ step1: step1Choice, sequence: nextSequence });
  };

  const handleOverrideSubmit = () => {
    const trimmed = overrideInput.trim();
    if (!trimmed || status === "checking") return;
    setOverrideInput("");
    submitLogin({ override: trimmed });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-black">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold text-cyan-300">Joe's Life</h1>

        {step === 1 && (
          <>
            <p className="text-slate-400 text-sm text-center">Pick the right icon.</p>
            <div className="grid grid-cols-4 gap-2.5">
              {grid.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => handleIconClick(icon)}
                  aria-label={icon.label}
                  className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl hover:border-cyan-600 transition-colors"
                >
                  {icon.emoji}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>You picked</span>
              <span
                className="inline-block w-4 h-4 rounded-full"
                style={{ backgroundColor: step1Color || "#666" }}
              />
            </div>
            <p className="text-slate-400 text-sm text-center">Now click the three circles in order.</p>
            <div className="flex gap-4">
              {COLORS.map((c) => {
                const pickedIndex = sequence.indexOf(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleColorClick(c.id)}
                    disabled={pickedIndex !== -1 || status === "checking"}
                    className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-white font-bold disabled:opacity-40"
                    style={{ backgroundColor: c.css, borderColor: pickedIndex !== -1 ? "#fff" : "transparent" }}
                  >
                    {pickedIndex !== -1 ? pickedIndex + 1 : ""}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {status === "checking" && (
          <p className="text-cyan-400 text-sm">Checking...</p>
        )}
        {message && (
          <p className="text-red-400 text-sm text-center">{message}</p>
        )}

        <div className="w-full pt-2 border-t border-slate-800 flex flex-col items-center gap-2">
          {!showOverride ? (
            <button
              onClick={() => setShowOverride(true)}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Locked out? Use a backup code
            </button>
          ) : (
            <div className="flex gap-2 w-full max-w-xs">
              <input
                type="password"
                className="flex-1 rounded-lg bg-slate-900 text-white placeholder-slate-500 px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-cyan-500"
                placeholder="Backup code"
                value={overrideInput}
                onChange={(e) => setOverrideInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOverrideSubmit()}
              />
              <button
                onClick={handleOverrideSubmit}
                disabled={!overrideInput.trim() || status === "checking"}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                Go
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
