"use client";

import React, { useCallback, useEffect, useState } from "react";

interface Proposal {
  id: string;
  description: string;
  rationale: string;
  area: string;
  status: "pending" | "approved" | "rejected" | "applied";
  createdAt: string;
}

// Deliberately decoupled from the chat's own text -- Hermes' reply is just
// conversation; this panel is the actual ground truth (the pending_site_changes
// collection), polled independently. Approve/reject only ever updates status
// here, never applies anything -- a human still makes the real code change.
export default function ProposalsPanel() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/proposals?status=pending");
      setProposals(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoaded(true); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  const act = async (id: string, status: "approved" | "rejected") => {
    setProposals((p) => p.filter((x) => x.id !== id));
    try {
      await fetch("/api/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch (e) { console.error(e); load(); }
  };

  // No worker consumes "approved" anymore (proposal-worker-pipeline.md) --
  // this just marks the proposal as acted-on and hands its text to
  // HermesChat via a DOM event, which switches itself to Coder mode and
  // pre-fills the input. A plain custom event (not prop-drilling through
  // page.tsx) because ProposalsPanel and HermesChat are independent
  // siblings there with no shared parent state today.
  const switchToCoder = (p: Proposal) => {
    window.dispatchEvent(
      new CustomEvent("hermes:switch-to-coder", { detail: { text: p.description } })
    );
    act(p.id, "approved");
  };

  if (!loaded || proposals.length === 0) return null;

  return (
    <div className="mc-panel p-3 flex flex-col gap-2" style={{ background: "#171a1f", borderColor: "rgba(245,166,35,0.35)" }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#f5a623]" />
        <span className="mc-label">Proposed Changes</span>
        <span className="mc-mono text-[10px] text-[#5b626d]">Hermes can&apos;t apply these itself -- switch to Coder mode to make the change</span>
      </div>
      {proposals.map((p) => (
        <div key={p.id} className="border border-white/10 rounded bg-[#0c0d10] p-2.5">
          <p className="text-[13px] text-[#e7eaee]">{p.description}</p>
          {p.area && <span className="mc-mono text-[10px] text-[#8a919c]">{p.area}</span>}
          {p.rationale && <p className="text-[11px] text-[#8a919c] mt-1">{p.rationale}</p>}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => switchToCoder(p)}
              className="mc-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-[#35c48b]/15 border border-[#35c48b] text-[#35c48b] hover:bg-[#35c48b]/25"
            >
              Switch to Coder &amp; continue
            </button>
            <button
              onClick={() => act(p.id, "rejected")}
              className="mc-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
