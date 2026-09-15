"use client";

import React, { useEffect, useMemo, useState } from "react";
import { askHermesDirect } from "../../utils/hermes/directChat";
import { NEWS_SECTIONS, POLITICO_SUBFEEDS, YOUTUBE_SITES } from "@/data/newsWatchlist";

interface Headline {
  title: string;
  url: string; // empty when the source section doesn't carry links (see below)
}
interface SiteSection {
  site: string;
  headlines: Headline[];
}

// The stored digest is NOT one consistent format -- verified directly
// against real content 2026-09-14, not assumed. Three shapes coexist in the
// same document depending on which part of news_roundup produced them:
//   1. Traditional (RSS) sites:  **Site**  \n- headline\n- headline    (no URLs at all)
//   2. Politico sections:        ## Site\n- **Title** – [Read more](URL)
//   3. Traditional Intl/others:  ### Site\n| Title | Link | Notes |    (markdown table)
// Handles all three rather than assuming one -- that assumption (a single
// pipe-table format) was the actual bug that made every source disappear.
// Verified directly against real stored content 2026-09-14: several sites
// (Ground News, WSJ, The Economist, Hassan Piker, Felix and Friends) had
// nothing but a "No new items..." placeholder line, which the old bullet
// regex happily counted as a real headline. ZeroHedge uses a numbered list
// with a bare URL (no [text](url) wrapper) and was being missed entirely.
// EuroDollar University prefixes a "**Video:**" label before the title.
const NO_ITEMS_RE = /no new (items?|content)|no items? (could be|were) fetched|feed returned no items/i;

function extractHeadlines(block: string): Headline[] {
  // 1. Markdown table rows: | Title | URL | ...
  const tableRow = /^\|\s*(.+?)\s*\|\s*(https?:\/\/\S+?)\s*\|/gm;
  const tableHeadlines = Array.from(block.matchAll(tableRow))
    .filter((m) => m[1].toLowerCase() !== "title" && !/^-+$/.test(m[1]) && !NO_ITEMS_RE.test(m[1]))
    .map((m) => ({ title: m[1].trim(), url: m[2].trim() }));
  if (tableHeadlines.length) return tableHeadlines;

  // 2. Any bulleted/numbered line carrying a URL -- covers every observed
  //    shape: "- **Title** – [Read more](url)", "1. *Title* – url",
  //    "- **Label:** *Title* – url". Title = leading text with markdown
  //    emphasis/link syntax stripped; url = the first http(s) link on the line.
  const urlLine = /^(?:-|\d+\.)\s*(.+?)\s*[–—-]\s*(?:\[[^\]]*\]\()?<?(https?:\/\/[^\s)>]+)>?\)?/gm;
  const linkedHeadlines: Headline[] = [];
  let lm: RegExpExecArray | null;
  while ((lm = urlLine.exec(block)) !== null) {
    const title = lm[1].replace(/\*\*/g, "").replace(/\*/g, "").replace(/:\s*$/, "").trim();
    if (!title || NO_ITEMS_RE.test(title)) continue;
    linkedHeadlines.push({ title, url: lm[2].trim() });
  }
  if (linkedHeadlines.length) return linkedHeadlines;

  // 3. Plain bullets with no URL anywhere on the line.
  const plainBullet = /^-\s+(.+)$/gm;
  return Array.from(block.matchAll(plainBullet))
    .map((m) => m[1].trim())
    .filter((t) => t.length > 2 && !NO_ITEMS_RE.test(t) && !/^\(?note:/i.test(t))
    .map((title) => ({ title, url: "" }));
}

// LLM-generated site names sometimes contain invisible Unicode oddities --
// confirmed directly against real stored content (U+202F narrow no-break
// space inside "Al Jazeera", not a normal space) that silently broke exact
// string matching against the watchlist mapping. Collapse every whitespace-
// like character to a normal space rather than assume plain ASCII spacing.
function normalizeSiteName(s: string): string {
  // Defensive, not just cosmetic: the digest's input section headers carry
  // "SiteName (feed URL)" so the model knows which fetched content belongs
  // to which site -- the system prompt tells it to drop that URL in its own
  // output, but a small local model doesn't always comply. Confirmed live
  // 2026-09-14: NYT's feed URL alone pushed its header past the 60-char
  // sanity filter below, silently dropping the whole section (shown as "0"
  // headlines); shorter ones (Fox, The Hill, Reuters, AP) survived the
  // filter but still rendered the raw URL as the site's display name. Strip
  // a trailing "(http...)" unconditionally rather than trust the prompt.
  const withoutUrl = s.replace(/\s*\(\s*https?:\/\/\S+?\s*\)\s*$/i, "");
  return withoutUrl.replace(/[\s   -‏  　﻿]+/g, " ").trim();
}

function parseDigest(digest: string): SiteSection[] {
  const headerRe = /^(?:\*\*([^*\n]+)\*\*|##\s+(.+?)|###\s+(.+?))\s*$/gm;
  const positions: { site: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(digest)) !== null) {
    const site = normalizeSiteName(m[1] || m[2] || m[3] || "");
    if (!site || site.length > 60 || /condensed news digest/i.test(site)) continue;
    positions.push({ site, index: m.index });
  }
  const sections: SiteSection[] = [];
  for (let i = 0; i < positions.length; i++) {
    const { site, index } = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1].index : digest.length;
    const headlines = extractHeadlines(digest.slice(index, end));
    if (headlines.length) sections.push({ site, headlines });
  }
  return sections;
}

// Politico is a Traditional/legacy outlet, not its own category -- the
// digest just emits its 6 RSS feeds (Politics/Congress/.../Energy) as
// separate headers. Combine them into one "Politico" source, prefixing each
// headline with its sub-feed so that context isn't lost in the merge.
function mergePoliticoSubfeeds(sections: SiteSection[]): SiteSection[] {
  const subfeeds = sections.filter((s) => POLITICO_SUBFEEDS.includes(s.site));
  if (!subfeeds.length) return sections;
  const merged: Headline[] = subfeeds.flatMap((s) => {
    const label = s.site.replace(/^Politico\s+/, "");
    return s.headlines.map((h) => ({ ...h, title: `[${label}] ${h.title}` }));
  });
  const rest = sections.filter((s) => !POLITICO_SUBFEEDS.includes(s.site));
  return merged.length ? [...rest, { site: "Politico", headlines: merged }] : rest;
}

// Same exact-then-substring matching as the grouped useMemo below, factored
// out so the staleness check (run per historical day) uses identical logic.
function headlineCountForSite(daySections: SiteSection[], knownSite: string): number {
  const norm = (s: string) => s.toLowerCase();
  const hit = daySections.find(
    (s) => s.site === knownSite || norm(s.site).includes(norm(knownSite)) || norm(knownSite).includes(norm(s.site))
  );
  return hit ? hit.headlines.length : 0;
}

// Shared by the single-article button below and the batch queue in
// MorningReviewPage, so the two paths can't drift apart.
//
// Was archive.is/Wayback-first (blocked-page-recovery skill) -- architecturally
// wrong for this feature, confirmed live 2026-09-14: Morning Review articles
// are same-day/hours-old, and Wayback/archive.today only have anything once a
// snapshot has been taken, which for fresh content is essentially never (a
// real BBC and Fox article from that day's own digest both failed with "no
// archive copy found"; a genuinely 5-day-old NYT article recovered fine,
// proving the mechanism itself works -- it's an age mismatch, not a broken
// tool). Considered adding Jina Reader (the one archive-ladder route that
// doesn't need a snapshot) but rejected: its free tier is a one-time 10M-token
// grant, not free-forever, which counts as a paid dependency even if the
// runway is long.
//
// Correct fix: point at the free-extract-first skill instead --
// read_webpage (free, zero dependency, first try) escalating only to
// web_extract/Firecrawl (paid, but already an existing Hermes dependency
// used by news_roundup itself, not a new one) when the free fetch comes back
// thin/JS-rendered. blocked-page-recovery is demoted to last resort, which is
// what it was actually designed for -- a genuinely paywalled same-day
// article (NYT) may still honestly fail there, and that's correct, not a bug
// to chase.
function buildSummaryPrompt(url: string): string {
  return `Use the free-extract-first skill (read_webpage, falling back to web_extract only if it comes back thin) to fetch this article, then give me a 2-3 sentence summary. If that fails, try the blocked-page-recovery skill as a last resort. If it still can't be recovered, say so plainly instead of guessing: ${url}`;
}

// Stable id for selection/results state that survives headlines with no
// url (~10 of the watchlist's sources return plain-text-only headlines).
const headlineId = (site: string, h: Headline): string => `${site}::${h.url || h.title}`;

interface SummaryResult {
  status: "pending" | "done" | "error";
  summary?: string;
  error?: string;
}

function HeadlineRow({
  headline,
  id,
  checked,
  batchResult,
  onToggleSelect,
}: {
  headline: Headline;
  id: string;
  checked: boolean;
  batchResult: SummaryResult | undefined;
  onToggleSelect: (id: string) => void;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await askHermesDirect(buildSummaryPrompt(headline.url));
      setSummary(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get a summary.");
    } finally {
      setLoading(false);
    }
  };

  // The batch result (from the floating bar's queue) takes precedence over
  // this row's own single-article state once it exists.
  const shownSummary = batchResult?.status === "done" ? batchResult.summary : summary;
  const shownError = batchResult?.status === "error" ? batchResult.error : error;
  const pending = batchResult?.status === "pending";

  return (
    <div className={`py-2 border-b border-white/[0.06] last:border-0 flex items-start gap-2 ${checked ? "bg-cyan-500/[0.06] rounded px-1 -mx-1" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={!headline.url}
        onChange={() => onToggleSelect(id)}
        title={!headline.url ? "No article URL -- can't be summarized" : undefined}
        className="mt-1.5 shrink-0 accent-cyan-500 disabled:opacity-30"
      />
      <div className="flex-1 min-w-0">
        {headline.url ? (
          <a href={headline.url} target="_blank" rel="noreferrer" className="font-serif text-[15px] text-[#e7eaee] hover:text-cyan-200 leading-snug">
            {headline.title}
          </a>
        ) : (
          <span className="font-serif text-[15px] text-[#e7eaee] leading-snug">{headline.title}</span>
        )}
        {!shownSummary && !pending && headline.url && (
          <button
            onClick={getSummary}
            disabled={loading}
            className="ml-3 text-[11px] text-slate-500 hover:text-cyan-300 disabled:opacity-40 underline align-middle"
          >
            {loading ? "fetching article..." : "get summary"}
          </button>
        )}
        {pending && <span className="ml-3 text-[11px] text-slate-500 align-middle">fetching article...</span>}
        {shownSummary && <p className="mt-1 text-[13px] text-slate-300 whitespace-pre-wrap font-serif">{shownSummary}</p>}
        {shownError && <p className="mt-1 text-xs text-red-400">{shownError}</p>}
      </div>
    </div>
  );
}

// Same P0-P3 scale and colors as the Work tab (home.css's --mc-p0/p1/p2
// tokens) -- the API used to hand back Linear's raw priorityLabel
// ("Urgent"/"High"/...) here instead of the app's actual P0-P3 convention.
const PRIORITY_COLORS: Record<string, string> = {
  P0: "#f0426a",
  P1: "#f5a623",
  P2: "#35c48b",
  P3: "#5b626d",
};

function PriorityTag({ priority }: { priority: string | null | undefined }) {
  if (!priority) return null;
  const color = PRIORITY_COLORS[priority] || "#5b626d";
  return (
    <span
      className="shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ color, border: `1px solid ${color}`, background: `${color}1a` }}
    >
      {priority}
    </span>
  );
}

function DueDateTag({ dueDate }: { dueDate: string | null | undefined }) {
  if (!dueDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  const late = dueDate < today;
  const text = new Date(dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <span className={`shrink-0 text-[10px] ${late ? "text-[#f0426a]" : "text-slate-500"}`}>{text}</span>
  );
}

function SourceToggle({
  site,
  headlines,
  stale,
  selected,
  results,
  onToggleSelect,
}: {
  site: string;
  headlines: Headline[];
  stale: boolean;
  selected: Set<string>;
  results: Map<string, SummaryResult>;
  onToggleSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const empty = headlines.length === 0;
  // Data-driven, not a hardcoded site list -- confirmed 2026-09-14 this is a
  // real news_roundup digest bug (the URL is fetched and even handed to the
  // digest-writing LLM call, the system prompt just never tells it to keep
  // the URL in its output) for NYT/Fox/Reuters/AP/The Hill specifically.
  // Flagging by actual data means this clears itself once that prompt fix
  // lands, rather than needing a manual list update here.
  const noLinks = !empty && headlines.every((h) => !h.url);
  return (
    <div className="mb-4 break-inside-avoid">
      <button
        onClick={() => !empty && setOpen((v) => !v)}
        disabled={empty}
        className={`w-full flex items-center justify-between gap-2 text-left mb-1 ${empty ? "opacity-40 cursor-default" : ""}`}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">{site}</span>
          {stale && (
            <span
              title="0 headlines for 3 days straight -- likely a broken fetch, not normal 'nothing new'"
              className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded text-[#f0426a] border border-[#f0426a] bg-[#f0426a1a]"
            >
              ⚠ stale
            </span>
          )}
          {noLinks && (
            <span
              title="These headlines carry no article URL -- known news_roundup digest bug, can't be opened or summarized until fixed"
              className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded text-[#f5a623] border border-[#f5a623] bg-[#f5a6231a]"
            >
              no links
            </span>
          )}
        </span>
        <span className="text-[11px] text-slate-500 shrink-0">({headlines.length}){!empty && ` ${open ? "−" : "+"}`}</span>
      </button>
      {open &&
        headlines.map((h, i) => {
          const id = headlineId(site, h) || `${site}-${i}`;
          return (
            <HeadlineRow
              key={id}
              id={id}
              headline={h}
              checked={selected.has(id)}
              batchResult={results.get(id)}
              onToggleSelect={onToggleSelect}
            />
          );
        })}
    </div>
  );
}

function ProjectToggle({ name, tasks }: { name: string; tasks: any[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 py-2 text-left"
      >
        <span className="text-[13px] font-medium text-slate-200">{name}</span>
        <span className="text-[11px] text-slate-500 shrink-0">{tasks.length} · {open ? "−" : "+"}</span>
      </button>
      {open && (
        <ul className="pb-2 space-y-1.5">
          {tasks.map((t: any) => (
            <li key={t.id} className="flex items-start gap-2 text-[12px] text-slate-300">
              <span className="flex-1 min-w-0">{t.title}</span>
              <PriorityTag priority={t.priority} />
              <DueDateTag dueDate={t.dueDate} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface QueueItem {
  id: string;
  site: string;
  headline: Headline;
  summary: string;
}

// Floating "N selected" bar -- newsletter-styled per the page's own look
// (not the app-wide mc dark-panel style), confirmed with the user before
// building. Owns nothing itself; all state/handlers are passed in from
// MorningReviewPage since selection/results/playback all need to survive
// this bar mounting and unmounting as `selected.size` crosses zero.
function BatchActionBar({
  selectedCount,
  batchRunning,
  onGetSummaries,
  onClear,
  supportsTTS,
  readState,
  readIndex,
  queue,
  onPlay,
  onPause,
  onSkip,
  onStop,
}: {
  selectedCount: number;
  batchRunning: boolean;
  onGetSummaries: () => void;
  onClear: () => void;
  supportsTTS: boolean;
  readState: "idle" | "playing" | "paused";
  readIndex: number;
  queue: QueueItem[];
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  onStop: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[700px] bg-[#171a1f] border border-cyan-800/60 rounded-t-xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-serif text-[14px] text-cyan-200">{selectedCount} selected</span>
          <button
            onClick={onGetSummaries}
            disabled={batchRunning}
            className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded bg-cyan-800/40 border border-cyan-700 text-cyan-200 hover:bg-cyan-800/60 disabled:opacity-40"
          >
            {batchRunning ? "Summarizing..." : "Get Summaries"}
          </button>
          {supportsTTS && queue.length > 0 && (
            <>
              {readState === "playing" ? (
                <button onClick={onPause} className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded border border-white/15 text-slate-300 hover:text-white">
                  Pause
                </button>
              ) : (
                <button onClick={onPlay} className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded border border-white/15 text-slate-300 hover:text-white">
                  {readState === "paused" ? "Resume" : "Read Aloud"}
                </button>
              )}
              {readState !== "idle" && (
                <>
                  <button onClick={onSkip} className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded border border-white/15 text-slate-300 hover:text-white">
                    Skip
                  </button>
                  <button onClick={onStop} className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded border border-white/15 text-slate-300 hover:text-white">
                    Stop
                  </button>
                </>
              )}
            </>
          )}
          <button onClick={onClear} className="ml-auto text-[11px] text-slate-500 hover:text-slate-300 underline">
            Clear
          </button>
        </div>
        {readState !== "idle" && queue[readIndex] && (
          <p className="text-[11px] text-slate-500">
            Now reading {readIndex + 1} of {queue.length}: {queue[readIndex].site} -- {queue[readIndex].headline.title}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MorningReviewPage() {
  const [journal, setJournal] = useState<{ content: string; entryDatetime: string } | null>(null);
  const [tasksByProject, setTasksByProject] = useState<Record<string, any[]> | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [siteSections, setSiteSections] = useState<SiteSection[]>([]);
  const [roundupDate, setRoundupDate] = useState<string | null>(null);
  const [staleSites, setStaleSites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, SummaryResult>>(new Map());
  const [batchRunning, setBatchRunning] = useState(false);
  const [readState, setReadState] = useState<"idle" | "playing" | "paused">("idle");
  const [readIndex, setReadIndex] = useState(0);
  const supportsTTS = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    (async () => {
      const [journalRes, tasksRes, roundupRes, historyRes] = await Promise.allSettled([
        fetch("/api/journal/latest").then((r) => r.json()),
        fetch("/api/tasks/by-project").then((r) => r.json()),
        fetch("/api/roundup").then((r) => r.json()),
        fetch("/api/roundup/history?days=3").then((r) => r.json()),
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
        setSiteSections(mergePoliticoSubfeeds(parseDigest(roundupRes.value.content)));
      }
      // Flag a source with 0 real headlines for every one of the last 3
      // days -- confirmed live 2026-09-14 this catches a genuine fetch
      // failure (CNN, Ground News: zero articles ever recorded, not just
      // "no new items since last check"), not normal incremental behavior.
      // YouTube channels excluded -- a channel not posting isn't a fetch bug.
      if (historyRes.status === "fulfilled" && Array.isArray(historyRes.value.roundups)) {
        const days = historyRes.value.roundups as { date: string; content: string }[];
        if (days.length >= 3) {
          const parsedDays = days
            .slice(0, 3)
            .map((d) => mergePoliticoSubfeeds(parseDigest(d.content)));
          const allSites = NEWS_SECTIONS.flatMap((g) => g.sites).filter((s) => !YOUTUBE_SITES.includes(s));
          const stale = new Set(
            allSites.filter((site) => parsedDays.every((day) => headlineCountForSite(day, site) === 0))
          );
          setStaleSites(stale);
        }
      }
      setLoading(false);
    })();
  }, []);

  // Group the digest's flat per-site sections into watchlist section ->
  // site -> headlines, so it's obvious which editorial section (Traditional/
  // Legacy, Politico, New Media, Business...) and which specific outlet each
  // headline actually came from, not just an undifferentiated site list.
  const grouped = useMemo(() => {
    // Exact match first, then a substring fallback in either direction --
    // confirmed against real digest content that the LLM doesn't always use
    // the watchlist's short name verbatim (e.g. "Council on Foreign
    // Relations (CFR)" in the digest vs "CFR" in the watchlist mapping).
    const norm = (s: string) => s.toLowerCase();
    const matched = new Set<string>();
    const out: { section: string; sites: SiteSection[] }[] = [];
    for (const { section, sites: knownSites } of NEWS_SECTIONS) {
      const present: SiteSection[] = [];
      for (const known of knownSites) {
        const hit = siteSections.find(
          (s) =>
            !matched.has(s.site) &&
            (s.site === known || norm(s.site).includes(norm(known)) || norm(known).includes(norm(s.site)))
        );
        if (hit) {
          present.push(hit);
          matched.add(hit.site);
        } else {
          // Genuinely checked, nothing new today -- show it as (0), not
          // silently absent, so watchlist coverage is provably complete
          // rather than looking randomly short.
          present.push({ site: known, headlines: [] });
        }
      }
      out.push({ section, sites: present });
    }
    // Anything left over (watchlist changed, or a one-off) -- still show it,
    // clearly labeled, rather than silently dropping real headlines.
    const unmatched = siteSections.filter((s) => !matched.has(s.site));
    if (unmatched.length) out.push({ section: "Other", sites: unmatched });
    return out;
  }, [siteSections]);

  // Flat list of every currently-selectable (url-having) headline across
  // every section, in page order -- feeds both the batch queue and the
  // read-aloud queue below.
  const allSelectableHeadlines = useMemo(
    () =>
      grouped.flatMap(({ sites }) =>
        sites.flatMap((s) =>
          s.headlines.filter((h) => h.url).map((h) => ({ site: s.site, headline: h, id: headlineId(s.site, h) }))
        )
      ),
    [grouped]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timed out waiting for a summary.")), ms)),
    ]);
  }

  const CONCURRENCY = 2;
  // The blocked-page-recovery skill tries up to 3 routes sequentially
  // (Wayback -> 4 archive.today host mirrors, each with 429 retries -> Jina),
  // each with its own ~25s fetch timeout -- a hard case like NYT (heavily
  // paywalled, often needs several archive.today mirrors before one lands)
  // can legitimately take well over a minute. 45s was cutting real, still-
  // working requests off client-side -- confirmed live 2026-09-14 (NYT
  // request reported "timed out" while the underlying browser_proxy has no
  // timeout of its own: sock_read=None in proxy.py). 120s comfortably covers
  // the ladder's worst case plus summarization.
  const SUMMARY_TIMEOUT_MS = 120_000;

  const runBatchSummaries = async () => {
    const targets = allSelectableHeadlines.filter(({ id }) => selected.has(id));
    if (!targets.length) return;
    setBatchRunning(true);
    setResults((prev) => {
      const next = new Map(prev);
      targets.forEach(({ id }) => next.set(id, { status: "pending" }));
      return next;
    });

    let cursor = 0;
    const worker = async () => {
      while (cursor < targets.length) {
        const item = targets[cursor++];
        try {
          const text = await withTimeout(askHermesDirect(buildSummaryPrompt(item.headline.url)), SUMMARY_TIMEOUT_MS);
          setResults((prev) => new Map(prev).set(item.id, { status: "done", summary: text }));
        } catch (err) {
          setResults((prev) =>
            new Map(prev).set(item.id, {
              status: "error",
              error: err instanceof Error ? err.message : "Could not get a summary.",
            })
          );
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
    setBatchRunning(false);
  };

  // Read-aloud queue: selected headlines with a completed summary, in page
  // order. Failed/pending ones are silently skipped from the SPOKEN queue
  // (not from the selection) -- reading an error message aloud isn't useful.
  const readQueue: QueueItem[] = allSelectableHeadlines
    .filter(({ id }) => selected.has(id) && results.get(id)?.status === "done")
    .map(({ id, site, headline }) => ({ id, site, headline, summary: results.get(id)!.summary! }));

  const speakFrom = (startAt: number) => {
    if (!supportsTTS) return;
    window.speechSynthesis.cancel();
    let i = startAt;
    const speakNext = () => {
      if (i >= readQueue.length) {
        setReadState("idle");
        setReadIndex(0);
        return;
      }
      setReadIndex(i);
      const item = readQueue[i];
      const utter = new SpeechSynthesisUtterance(`${item.site}. ${item.headline.title}. ${item.summary}`);
      utter.onend = () => {
        i += 1;
        speakNext();
      };
      utter.onerror = () => {
        i += 1;
        speakNext();
      };
      window.speechSynthesis.speak(utter);
    };
    setReadState("playing");
    speakNext();
  };

  const handlePlay = () => {
    if (readState === "paused") {
      window.speechSynthesis.resume();
      setReadState("playing");
    } else {
      speakFrom(0);
    }
  };
  const handlePause = () => {
    window.speechSynthesis.pause();
    setReadState("paused");
  };
  const handleSkip = () => speakFrom(readIndex + 1);
  const handleStop = () => {
    window.speechSynthesis.cancel();
    setReadState("idle");
    setReadIndex(0);
  };

  useEffect(() => {
    return () => {
      if (supportsTTS) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0c0d10]">
      <div className="text-white px-4 py-8 max-w-5xl mx-auto">
        {/* masthead */}
        <div className="text-center border-b-2 border-cyan-800/60 pb-4 mb-8">
          <h1 className="font-serif text-4xl tracking-tight text-cyan-200">Morning Review</h1>
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mt-2">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {loading && <p className="text-slate-400 text-center">Loading...</p>}

        {/* Tasks (1/3) + Journal (2/3) */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <section className="md:col-span-1 bg-[#171a1f] rounded-xl border border-white/10 p-4">
            <h2 className="font-serif text-lg text-cyan-200 mb-1">Open Tasks by Project</h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">tap a project to expand</p>
            {tasksError && <p className="text-sm text-red-400">{tasksError}</p>}
            {tasksByProject &&
              Object.entries(tasksByProject)
                .sort(([a], [b]) => (a === "ToDos" ? -1 : b === "ToDos" ? 1 : a.localeCompare(b)))
                .map(([project, tasks]) => <ProjectToggle key={project} name={project} tasks={tasks} />)}
          </section>

          <section className="md:col-span-2 bg-[#171a1f] rounded-xl border border-white/10 p-4">
            <h2 className="font-serif text-lg text-cyan-200 mb-1">Last Journal Entry</h2>
            {journal ? (
              <>
                <p className="text-xs text-slate-500 mb-2">{new Date(journal.entryDatetime).toLocaleString()}</p>
                <p className="text-[14px] text-slate-300 whitespace-pre-wrap font-serif leading-relaxed">{journal.content}</p>
              </>
            ) : (
              !loading && <p className="text-sm text-slate-500">No recent journal entry.</p>
            )}
          </section>
        </div>

        {/* News Roundup, grouped by watchlist section -> source */}
        <section>
          <div className="flex items-baseline gap-3 border-b-2 border-cyan-800/60 pb-2 mb-4">
            <h2 className="font-serif text-2xl text-cyan-200">News Roundup</h2>
            {roundupDate && <span className="text-[11px] uppercase tracking-widest text-slate-500">{roundupDate}</span>}
          </div>
          {!loading && grouped.length === 0 && <p className="text-sm text-slate-400">No roundup yet.</p>}
          {grouped.map(({ section, sites }) => (
            <div key={section} className="mb-8">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-500/80 font-semibold mb-3 pb-1 border-b border-cyan-900/50">
                {section}
              </h3>
              <div className="grid md:grid-cols-2 gap-x-8">
                {sites.map((s) => {
                  const norm = (x: string) => x.toLowerCase();
                  const stale = [...staleSites].some(
                    (known) => s.site === known || norm(s.site).includes(norm(known)) || norm(known).includes(norm(s.site))
                  );
                  return (
                    <SourceToggle
                      key={s.site}
                      site={s.site}
                      headlines={s.headlines}
                      stale={stale}
                      selected={selected}
                      results={results}
                      onToggleSelect={toggleSelect}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>

      {selected.size > 0 && (
        <BatchActionBar
          selectedCount={selected.size}
          batchRunning={batchRunning}
          onGetSummaries={runBatchSummaries}
          onClear={() => {
            handleStop();
            setSelected(new Set());
          }}
          supportsTTS={supportsTTS}
          readState={readState}
          readIndex={readIndex}
          queue={readQueue}
          onPlay={handlePlay}
          onPause={handlePause}
          onSkip={handleSkip}
          onStop={handleStop}
        />
      )}
    </div>
  );
}
