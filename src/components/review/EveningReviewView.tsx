"use client";

import React, { useCallback, useEffect, useState } from "react";

interface Proposal {
  id: string;
  type: "memory" | "task";
  content: string;
  category: string;
  source: string;
  destination: "linear" | "calendar" | null;
  eventDate: string | null;
  eventTime: string | null;
  relatedMemoryId: string | null;
  relatedMemoryPreview: string | null;
  status: string;
  createdAt: string;
}

interface ActiveMemory {
  id: string;
  content: string;
  category: string;
}

interface ReviewDoc {
  id: string;
  date: string;
  userMdDiff: string;
  userMdStatus: "pending" | "confirmed" | "revert_requested";
  hasJournalToday: boolean;
  tomorrowEvents: { summary: string; start: string }[];
  tomorrowTasks: Record<string, { id: string; title: string; priority: string }[]>;
  status: "pending" | "reviewed";
}

async function postAction(body: Record<string, unknown>) {
  const res = await fetch("/api/evening-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

// One diff line -- +/- prefixed lines from the unified diff evening_review_cron.py
// writes (Python's difflib.unified_diff). File-header (---/+++) and hunk (@@)
// lines are filtered out before this renders; only content lines reach here.
function DiffLine({ line }: { line: string }) {
  const added = line.startsWith("+");
  const removed = line.startsWith("-");
  return (
    <div
      className={`font-mono text-[12px] whitespace-pre-wrap px-2 py-0.5 rounded ${
        added ? "bg-[#35c48b]/10 text-[#35c48b]" : removed ? "bg-[#f0426a]/10 text-[#f0426a]" : "text-slate-400"
      }`}
    >
      {line}
    </div>
  );
}

function ProposalCard({
  proposal,
  onApprove,
  onReject,
  onRetireLinkedMemory,
}: {
  proposal: Proposal;
  onApprove: (id: string, asSupersede: boolean) => void;
  onReject: (id: string) => void;
  onRetireLinkedMemory: (memoryId: string, proposalId: string) => void;
}) {
  const isTask = proposal.type === "task";
  return (
    <div className="border border-white/10 rounded bg-[#0c0d10] p-3">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
            isTask ? "text-[#f5a623] border border-[#f5a623] bg-[#f5a6231a]" : "text-cyan-300 border border-cyan-700 bg-cyan-900/20"
          }`}
        >
          {isTask ? "task" : "memory"}
        </span>
        <span className="text-[10px] text-slate-500">{proposal.category}</span>
        {isTask && proposal.destination === "calendar" && (
          <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded text-[#378add] border border-[#378add] bg-[#378add1a]">
            calendar
          </span>
        )}
      </div>
      <p className="text-[14px] text-[#e7eaee] font-serif">{proposal.content}</p>
      {isTask && proposal.destination === "calendar" && proposal.eventDate && (
        <p className="mt-1 text-[11px] text-slate-500">
          {proposal.eventDate}
          {proposal.eventTime ? ` at ${proposal.eventTime}` : ""}
        </p>
      )}

      {proposal.relatedMemoryPreview && !isTask && (
        <p className="mt-2 text-[11px] text-slate-500 italic">
          Related to existing memory: &quot;{proposal.relatedMemoryPreview}&quot;
        </p>
      )}
      {proposal.relatedMemoryPreview && isTask && (
        <p className="mt-2 text-[11px] text-[#f5a623]">
          This also exists as an active memory: &quot;{proposal.relatedMemoryPreview}&quot; -- probably saved before
          tasks and memories were separated.
        </p>
      )}

      <div className="flex gap-2 mt-3 flex-wrap">
        <button
          onClick={() => onApprove(proposal.id, false)}
          className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-[#35c48b]/15 border border-[#35c48b] text-[#35c48b] hover:bg-[#35c48b]/25"
        >
          {isTask ? `Approve -- add to ${proposal.destination === "calendar" ? "Calendar" : "Linear"}` : "Approve as new"}
        </button>
        {!isTask && proposal.relatedMemoryId && (
          <button
            onClick={() => onApprove(proposal.id, true)}
            className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-cyan-800/40 border border-cyan-700 text-cyan-200 hover:bg-cyan-800/60"
          >
            Approve as update (supersede)
          </button>
        )}
        {isTask && proposal.relatedMemoryId && (
          <button
            onClick={() => onRetireLinkedMemory(proposal.relatedMemoryId!, proposal.id)}
            className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-[#f5a623]/15 border border-[#f5a623] text-[#f5a623] hover:bg-[#f5a623]/25"
          >
            Retire linked memory
          </button>
        )}
        <button
          onClick={() => onReject(proposal.id)}
          className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function EveningReviewView() {
  const [review, setReview] = useState<ReviewDoc | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journalText, setJournalText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/evening-review");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReview(data.review);
      setProposals(data.proposals || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load Evening Review.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const withBusy = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const approve = (id: string, asSupersede: boolean) =>
    withBusy(() => postAction({ action: "approve_proposal", id, asSupersede }));
  const reject = (id: string) => withBusy(() => postAction({ action: "reject_proposal", id }));
  const retireLinked = (memoryId: string, proposalId: string) =>
    withBusy(async () => {
      await postAction({ action: "retire_memory", memoryId });
      await postAction({ action: "approve_proposal", id: proposalId, asSupersede: false });
    });

  const setUserMd = (status: "confirmed" | "revert_requested") =>
    withBusy(() => postAction({ action: "set_user_md_status", reviewId: review!.id, status }));

  const saveJournal = () =>
    withBusy(async () => {
      await postAction({ action: "save_journal", reviewId: review!.id, content: journalText });
      setJournalText("");
    });

  const finishReview = () => withBusy(() => postAction({ action: "mark_review_complete", reviewId: review!.id }));

  // Diff lines only -- header (---/+++) and hunk (@@) lines from Python's
  // unified_diff carry no useful content for this view.
  const diffLines = (review?.userMdDiff || "")
    .split("\n")
    .filter((l) => l && !l.startsWith("---") && !l.startsWith("+++") && !l.startsWith("@@"));

  return (
    <div className="min-h-screen w-full bg-[#0c0d10]">
      <div className="text-white px-4 py-8 max-w-3xl mx-auto">
        <div className="text-center border-b-2 border-cyan-800/60 pb-4 mb-8">
          <h1 className="font-serif text-4xl tracking-tight text-cyan-200">Evening Review</h1>
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mt-2">{review?.date || "..."}</p>
        </div>

        {loading && <p className="text-slate-400 text-center">Loading...</p>}
        {error && <p className="text-sm text-red-400 text-center mb-4">{error}</p>}

        {!loading && !review && (
          <p className="text-sm text-slate-500 text-center">No Evening Review yet -- runs nightly at 8pm ET.</p>
        )}

        {review && (
          <>
            {diffLines.length > 0 && (
              <section className="mb-8 bg-[#171a1f] rounded-xl border border-white/10 p-4">
                <h2 className="font-serif text-lg text-cyan-200 mb-2">USER.md changes</h2>
                <p className="text-[11px] text-slate-500 mb-3">
                  Changed since your last review. Confirm to keep, or revert -- takes effect on tonight&apos;s cron run.
                </p>
                <div className="flex flex-col gap-0.5 bg-[#0c0d10] rounded p-2 mb-3 max-h-64 overflow-y-auto">
                  {diffLines.map((l, i) => <DiffLine key={i} line={l} />)}
                </div>
                {review.userMdStatus === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserMd("confirmed")}
                      disabled={busy}
                      className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-[#35c48b]/15 border border-[#35c48b] text-[#35c48b] hover:bg-[#35c48b]/25 disabled:opacity-40"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setUserMd("revert_requested")}
                      disabled={busy}
                      className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-[#f0426a]/15 border border-[#f0426a] text-[#f0426a] hover:bg-[#f0426a]/25 disabled:opacity-40"
                    >
                      Revert
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    {review.userMdStatus === "confirmed" ? "Confirmed." : "Revert requested -- restores on the next cron run."}
                  </p>
                )}
              </section>
            )}

            <section className="mb-8 bg-[#171a1f] rounded-xl border border-white/10 p-4">
              <h2 className="font-serif text-lg text-cyan-200 mb-1">Proposals</h2>
              <p className="text-[11px] text-slate-500 mb-3">
                Nothing here is saved yet. Unreviewed items roll forward to the next review.
              </p>
              {proposals.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing pending.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {proposals.map((p) => (
                    <ProposalCard
                      key={p.id}
                      proposal={p}
                      onApprove={approve}
                      onReject={reject}
                      onRetireLinkedMemory={retireLinked}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mb-8 bg-[#171a1f] rounded-xl border border-white/10 p-4">
              <h2 className="font-serif text-lg text-cyan-200 mb-2">Journal</h2>
              {review.hasJournalToday ? (
                <p className="text-[13px] text-slate-500">Already journaled today.</p>
              ) : (
                <>
                  <textarea
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    rows={5}
                    placeholder="Write tonight's entry..."
                    className="w-full bg-[#0c0d10] border border-white/15 rounded p-2 text-[14px] text-slate-200 font-serif placeholder:text-slate-600"
                  />
                  <button
                    onClick={saveJournal}
                    disabled={busy || !journalText.trim()}
                    className="mt-3 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-[#35c48b]/15 border border-[#35c48b] text-[#35c48b] hover:bg-[#35c48b]/25 disabled:opacity-40"
                  >
                    Save
                  </button>
                </>
              )}
            </section>

            <section className="mb-8 bg-[#171a1f] rounded-xl border border-white/10 p-4">
              <h2 className="font-serif text-lg text-cyan-200 mb-3">Tomorrow</h2>
              {review.tomorrowEvents.length === 0 && Object.keys(review.tomorrowTasks).length === 0 ? (
                <p className="text-sm text-slate-500">Nothing scheduled.</p>
              ) : (
                <>
                  {review.tomorrowEvents.map((e, i) => (
                    <p key={i} className="text-[13px] text-slate-300 mb-1">
                      {e.summary} <span className="text-slate-500">-- {e.start}</span>
                    </p>
                  ))}
                  {Object.entries(review.tomorrowTasks).map(([project, tasks]) => (
                    <div key={project} className="mt-2">
                      <p className="text-[11px] uppercase tracking-widest text-slate-500">{project}</p>
                      {tasks.map((t) => (
                        <p key={t.id} className="text-[13px] text-slate-300 ml-2">
                          {t.title}
                        </p>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </section>

            {review.status === "pending" ? (
              <button
                onClick={finishReview}
                disabled={busy}
                className="w-full text-[12px] uppercase tracking-widest px-4 py-2.5 rounded bg-cyan-800/40 border border-cyan-700 text-cyan-200 hover:bg-cyan-800/60 disabled:opacity-40"
              >
                Done for tonight
              </button>
            ) : (
              <p className="text-center text-[11px] text-slate-500">Reviewed for tonight.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
