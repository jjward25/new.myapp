"use client";

import React, { useEffect, useMemo, useState } from "react";

interface Swatch {
  id: string;
  css: string;
}

interface IconDef {
  id: string;
  emoji: string;
  label: string;
  // The 3 colors shown on the final step when THIS icon is the one picked
  // in step 2. Each icon has its own trio, so the final screen doesn't
  // always show red/yellow/green — which would telegraph "pick the traffic
  // light." Order here is irrelevant; the circles are reshuffled on render.
  colors: Swatch[];
}

const PALETTE: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  blue: "#3b82f6",
  indigo: "#6366f1",
  purple: "#a855f7",
  pink: "#ec4899",
  rose: "#f43f5e",
  brown: "#92400e",
  slate: "#64748b",
};

const trio = (...ids: string[]): Swatch[] => ids.map((id) => ({ id, css: PALETTE[id] }));

// 16 icons (4x4 grid). The puzzle is 3 steps: pick the target icon, pick it
// again from a reshuffled grid, then click that icon's 3 colors in order —
// 16 x 16 x 3! = 1536 combinations. Which icon is "correct" and what color
// order follows are never encoded here or anywhere else client-side — this
// component only ever reports back exactly what was clicked; the actual
// answer lives only in server env vars (see /api/login/route.js). Only the
// traffic light carries {red,yellow,green} together, so those colors only
// appear once you've actually picked it in step 2.
const ICONS: IconDef[] = [
  { id: "trafficlight", emoji: "🚦", label: "Traffic light", colors: trio("green", "yellow", "red") },
  { id: "unicorn", emoji: "🦄", label: "Unicorn", colors: trio("pink", "purple", "cyan") },
  { id: "rainbow", emoji: "🌈", label: "Rainbow", colors: trio("red", "green", "blue") },
  { id: "fire", emoji: "🔥", label: "Fire", colors: trio("red", "orange", "yellow") },
  { id: "wave", emoji: "🌊", label: "Wave", colors: trio("blue", "teal", "cyan") },
  { id: "grapes", emoji: "🍇", label: "Grapes", colors: trio("purple", "green", "pink") },
  { id: "blossom", emoji: "🌸", label: "Blossom", colors: trio("pink", "rose", "purple") },
  { id: "leaf", emoji: "🍃", label: "Leaf", colors: trio("green", "teal", "brown") },
  { id: "snowflake", emoji: "❄️", label: "Snowflake", colors: trio("cyan", "blue", "slate") },
  { id: "chocolate", emoji: "🍫", label: "Chocolate", colors: trio("brown", "orange", "yellow") },
  { id: "moon", emoji: "🌙", label: "Moon", colors: trio("indigo", "slate", "yellow") },
  { id: "butterfly", emoji: "🦋", label: "Butterfly", colors: trio("teal", "orange", "purple") },
  { id: "galaxy", emoji: "🌌", label: "Galaxy", colors: trio("indigo", "purple", "pink") },
  { id: "dolphin", emoji: "🐬", label: "Dolphin", colors: trio("blue", "cyan", "slate") },
  { id: "candy", emoji: "🍬", label: "Candy", colors: trio("pink", "teal", "yellow") },
  { id: "balloon", emoji: "🎈", label: "Balloon", colors: trio("red", "blue", "yellow") },
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1Choice, setStep1Choice] = useState<string | null>(null);
  const [step2Choice, setStep2Choice] = useState<string | null>(null);
  const [colorChoices, setColorChoices] = useState<Swatch[]>([]);
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
    setStep2Choice(null);
    setColorChoices([]);
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
      // Server says this IP (or the whole site) is now locked out — the
      // puzzle won't help until the window clears, so surface the backup
      // code path instead of leaving the user to hunt for it.
      if (data?.lockedOut) setShowOverride(true);
      reset();
    } catch {
      setStatus("error");
      setMessage("Network error — try again.");
      reset();
    }
  };

  const handleIconClick = (icon: IconDef) => {
    if (status === "checking") return;
    if (step === 1) {
      setStep1Choice(icon.id);
      setGrid(shuffled(ICONS));
      setStep(2);
    } else if (step === 2) {
      setStep2Choice(icon.id);
      // Final step shows the colors that belong to the icon just picked,
      // in a random position order so the answer can't be memorised as
      // "left, middle, right."
      setColorChoices(shuffled(icon.colors));
      setSequence([]);
      setStep(3);
    }
  };

  const handleColorClick = (colorId: string) => {
    if (status === "checking") return;
    const nextSequence = [...sequence, colorId];
    setSequence(nextSequence);
    if (nextSequence.length < 3) return;
    submitLogin({ step1: step1Choice, step2: step2Choice, sequence: nextSequence });
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
        <h1 className="text-2xl font-semibold text-cyan-300">Joe&apos;s Life</h1>

        {(step === 1 || step === 2) && (
          <>
            <p className="text-slate-400 text-sm text-center">
              {step === 1 ? "Pick the right icon." : "Pick it again."}
            </p>
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

        {step === 3 && (
          <>
            <p className="text-slate-400 text-sm text-center">Now click the three circles in order.</p>
            <div className="flex gap-4">
              {colorChoices.map((c) => {
                const pickedIndex = sequence.indexOf(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleColorClick(c.id)}
                    disabled={pickedIndex !== -1 || status === "checking"}
                    aria-label={c.id}
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
