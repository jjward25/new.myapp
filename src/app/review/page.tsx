"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import MorningReviewView from "@/components/review/MorningReviewView";
import EveningReviewView from "@/components/review/EveningReviewView";

type Mode = "morning" | "evening";

// 8pm is Hermes' own Evening Review cron schedule (evening_review_cron.py,
// "0 20 * * *"), fixed to America/New_York regardless of the viewer's own
// timezone/device clock -- the default here has to match that clock, not the
// browser's, or someone west of Eastern would see "Evening Review" hours
// before it's actually been generated for the day.
function defaultModeForNow(): Mode {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }).format(new Date())
  );
  return hour >= 20 ? "evening" : "morning";
}

export default function ReviewPage() {
  // null until mounted -- computing this at module/render time would use the
  // server's clock (SSR) or flash the wrong default before hydration; one
  // client-side effect settles it once, matching the viewer's real moment.
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    setMode(defaultModeForNow());
  }, []);

  if (mode === null) return null;

  const toggle = () => setMode((m) => (m === "morning" ? "evening" : "morning"));
  const isMorning = mode === "morning";

  return (
    // Background matches whichever view is active -- MorningReviewView is
    // its own beige page now, EveningReviewView stays dark; this shell wraps
    // both, so a mismatched hardcoded bg here left a visible seam (a dark
    // strip above Morning Review, where the toggle row sits outside either
    // view's own wrapper) rather than blending into whichever one is shown.
    <div className={`min-h-screen w-full ${isMorning ? "bg-[#efe0c3]" : "bg-[#0c0d10]"}`}>
      <div className="max-w-5xl mx-auto px-4 pt-3 flex justify-end">
        <button
          onClick={toggle}
          title={isMorning ? "Switch to Evening Review" : "Switch to Morning Review"}
          className={
            isMorning
              ? "flex items-center justify-center w-8 h-8 rounded-full border border-[#7a3324]/40 text-[#7a3324] hover:border-[#7a3324] bg-[#f8f1e0]"
              : "flex items-center justify-center w-8 h-8 rounded-full border border-white/15 text-slate-400 hover:text-white hover:border-white/30 bg-[#171a1f]"
          }
        >
          {isMorning ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>
      {isMorning ? <MorningReviewView /> : <EveningReviewView />}
    </div>
  );
}
