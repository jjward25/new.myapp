"use client";

import React, { useMemo, useState } from "react";

interface Entry {
  _id: string;
  exercise: string;
  session_type: string;
  sets: { reps: number | null; weight: number | null; unit?: string }[] | null;
  cardio: { miles: number | null; minutes: number | null } | null;
  date: string;
  category: string;
  rir: string | null;
  rom: string | null;
  notes: string;
}

const catLabel = (c: string) => {
  const map: Record<string, string> = {
    stretch: "Mon · Stretch", squeeze: "Wed · Squeeze", "360": "Fri · 360",
    speed: "Sat · Speed", durability: "Sun · Durability", morning_mobility: "Morning Mobility",
    nightly: "Nightly", cardio: "Cardio",
  };
  if (map[c]) return map[c];
  if (c.startsWith("legacy_")) return `Legacy ${c.slice(7).toUpperCase()}`;
  if (c.startsWith("simple_")) return c.slice(7).replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
  return c || "Other";
};

const setStr = (e: Entry) => {
  if (e.cardio) return `${e.cardio.miles ?? "?"} mi${e.cardio.minutes ? ` / ${e.cardio.minutes} min` : ""}`;
  if (e.sets?.length) return e.sets.map((s) => `${s.reps ?? "?"}${s.weight ? `×${s.weight}` : ""}`).join("  ");
  return "—";
};

export default function WorkoutHistory({ sessions }: { sessions: Entry[] }) {
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});

  const byDate = useMemo(() => {
    const g: Record<string, Entry[]> = {};
    for (const e of sessions || []) (g[e.date] ||= []).push(e);
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sessions]);

  if (!byDate.length) {
    return (
      <div className="mc-panel p-4" style={{ background: "#171a1f" }}>
        <p className="mc-mono text-[11px] text-[#8a919c] italic">No sessions logged yet.</p>
      </div>
    );
  }

  return (
    <div className="mc-panel p-0" style={{ background: "#171a1f", borderColor: "rgba(255,255,255,0.14)" }}>
      <div className="mc-label px-4 py-3 border-b border-white/[0.08]">Session Log · {byDate.length} days</div>
      <div className="max-h-[70vh] overflow-y-auto">
        {byDate.map(([date, entries], idx) => {
          const cats = [...new Set(entries.map((e) => e.category).map(catLabel))];
          const open = openDates[date] ?? idx < 3;
          return (
            <div key={date} className="border-b border-white/[0.06] last:border-0">
              <button
                onClick={() => setOpenDates((p) => ({ ...p, [date]: !open }))}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left"
              >
                <span className="mc-mono text-[10px] text-[#5b626d] w-3">{open ? "−" : "+"}</span>
                <span className="mc-mono text-[12px] text-[#c4c9d1]">{date}</span>
                <span className="mc-mono text-[10px] text-[#8a919c] truncate">{cats.join(" · ")}</span>
                <span className="mc-mono text-[10px] text-[#5b626d] ml-auto">{entries.length}</span>
              </button>
              {open && (
                <div className="px-4 pb-2.5">
                  {entries.map((e) => (
                    <div key={e._id} className="grid grid-cols-[1fr_auto] gap-x-3 py-1 border-b border-white/[0.04] last:border-0">
                      <span className="text-[13px] text-[#e7eaee]">
                        {e.exercise}
                        {e.rir && <span className="mc-mono text-[10px] text-[#8a919c] ml-2">RIR {e.rir}</span>}
                        {e.rom && e.rom !== "—" && (
                          <span
                            className="mc-mono text-[10px] ml-1.5"
                            style={{ color: e.rom === "held" ? "#35c48b" : "#f5a623" }}
                          >
                            ROM {e.rom}
                          </span>
                        )}
                      </span>
                      <span className="mc-mono text-[11px] text-[#c4c9d1] text-right">{setStr(e)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
