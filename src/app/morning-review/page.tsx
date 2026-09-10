"use client";

import React, { useEffect, useState } from "react";
import { askHermesDirect } from "../../utils/hermes/directChat";

interface Headline {
  title: string;
  url: string;
}
interface Section {
  site: string;
  headlines: Headline[];
}

// The roundup digest is markdown: "**Site – Date**" headers followed by
// "| Title | URL |" tables (see plugins/news/tools.py's system prompt).
// Parsed client-side rather than changing news_roundup's own storage shape.
function parseDigest(digest: string): Section[] {
  const sections: Section[] = [];
  const blocks = digest.split(/\n(?=\*\*)/);
  for (const block of blocks) {
    const headerMatch = block.match(/^\*\*(.+?)\*\*/);
    if (!headerMatch) continue;
    const site = headerMatch[1].replace(/\s*[–-]\s*\S.*$/, "").trim();
    const rows = Array.from(block.matchAll(/\|\s*(.+?)\s*\|\s*(<?https?:\/\/[^\s|>]+)>?\s*\|/g));
    const headlines = rows
      .filter((r) => !/^-+$/.test(r[1]) && r[1].toLowerCase() !== "title")
      .map((r) => ({ title: r[1].trim(), url: r[2].trim() }));
    if (headlines.length) sections.push({ site, headlines });
  }
  return sections;
}

function HeadlineRow({ headline }: { headline: Headline }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await askHermesDirect(
        `Use the blocked-page-recovery skill to fetch this article via archive.is/Wayback, then give me a 2-3 sentence summary. If it can't be recovered, say so plainly instead of guessing: ${headline.url}`
      );
      setSummary(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get a summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-2 border-b border-slate-800 last:border-0">
      <a href={headline.url} target="_blank" rel="noreferrer" className="text-cyan-200 hover:text-cyan-100 text-sm">
        {headline.title}
      </a>
      {!summary && (
        <button
          onClick={getSummary}
          disabled={loading}
          className="ml-3 text-xs text-slate-400 hover:text-cyan-300 disabled:opacity-40 underline"
        >
          {loading ? "fetching via archive.is..." : "get summary"}
        </button>
      )}
      {summary && <p className="mt-1 text-sm text-slate-300 whitespace-pre-wrap">{summary}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function MorningReviewPage() {
  const [journal, setJournal] = useState<{ content: string; entryDatetime: string } | null>(null);
  const [tasksByProject, setTasksByProject] = useState<Record<string, any[]> | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [roundupDate, setRoundupDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [journalRes, tasksRes, roundupRes] = await Promise.allSettled([
        fetch("/api/journal/latest").then((r) => r.json()),
        fetch("/api/tasks/by-project").then((r) => r.json()),
        fetch("/api/roundup").then((r) => r.json()),
      ]);

      if (journalRes.status === "fulfilled" && journalRes.value.found) {
        setJournal(journalRes.value);
      }
      if (tasksRes.status === "fulfilled") {
        if (tasksRes.value.projects) setTasksByProject(tasksRes.value.projects);
        else setTasksError(tasksRes.value.error || "Could not load tasks.");
      } else {
        setTasksError("Could not load tasks.");
      }
      if (roundupRes.status === "fulfilled" && roundupRes.value.found) {
        setRoundupDate(roundupRes.value.date);
        setSections(parseDigest(roundupRes.value.content));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-cyan-300 mb-6">Morning Review</h1>

      {loading && <p className="text-slate-400">Loading...</p>}

      {journal && (
        <section className="mb-6 bg-slate-900 rounded-xl border border-slate-800 p-4">
          <h2 className="text-cyan-300 font-medium mb-2">Last Journal Entry</h2>
          <p className="text-xs text-slate-500 mb-2">{new Date(journal.entryDatetime).toLocaleString()}</p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{journal.content}</p>
        </section>
      )}

      <section className="mb-6 bg-slate-900 rounded-xl border border-slate-800 p-4">
        <h2 className="text-cyan-300 font-medium mb-2">Open Tasks by Project</h2>
        {tasksError && <p className="text-sm text-red-400">{tasksError}</p>}
        {tasksByProject &&
          Object.entries(tasksByProject).map(([project, tasks]) => (
            <div key={project} className="mb-3">
              <h3 className="text-sm font-medium text-slate-200">{project}</h3>
              <ul className="ml-4 list-disc text-sm text-slate-300">
                {tasks.map((t: any) => (
                  <li key={t.id}>
                    {t.title} <span className="text-slate-500">({t.id} — {t.state})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </section>

      <section className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <h2 className="text-cyan-300 font-medium mb-1">News Roundup</h2>
        {roundupDate && <p className="text-xs text-slate-500 mb-3">{roundupDate}</p>}
        {!loading && sections.length === 0 && <p className="text-sm text-slate-400">No roundup yet.</p>}
        {sections.map((section) => (
          <div key={section.site} className="mb-4">
            <h3 className="text-sm font-medium text-slate-200 mb-1">{section.site}</h3>
            {section.headlines.map((h) => (
              <HeadlineRow key={h.url} headline={h} />
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
