"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { askHermesDirect, synthesizeSpeech } from "../../utils/hermes/directChat";
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

// Read-aloud voices -- must match browser_proxy/proxy.py's TTS_VOICES
// allowlist exactly (that's a fixed server-side list, not client-supplied).
// All edge-tts, free, no API key -- see that file's own comment for why.
const TTS_VOICES = [
  { id: "en-GB-SoniaNeural", label: "Sonia (UK)" },
  { id: "en-US-AriaNeural", label: "Aria (US)" },
  { id: "en-US-JennyNeural", label: "Jenny (US)" },
  { id: "en-US-AndrewNeural", label: "Andrew (US)" },
  { id: "en-US-BrianNeural", label: "Brian (US)" },
];
const DEFAULT_TTS_VOICE = TTS_VOICES[0].id;
const TTS_VOICE_KEY = "morningReview.ttsVoice";

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
  // 2026-09-15: the single-article "get summary" click was removed -- the
  // checkbox + "Get Summaries" batch flow is now the only way to summarize,
  // so this row is just a checkbox, the headline, and a light status
  // indicator once a batch result exists (full text renders once, in
  // SelectedSummariesPanel below, not duplicated here).
  const pending = batchResult?.status === "pending";
  const batchDone = batchResult?.status === "done";
  const batchError = batchResult?.status === "error";

  return (
    <div className={`py-2 border-b border-[#00000014] last:border-0 flex items-start gap-2 ${checked ? "bg-[#7a3324]/[0.06] rounded px-1 -mx-1" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={!headline.url}
        onChange={() => onToggleSelect(id)}
        title={!headline.url ? "No article URL -- can't be summarized" : undefined}
        className="mt-1.5 shrink-0 accent-[#7a3324] disabled:opacity-30"
      />
      <div className="flex-1 min-w-0">
        {headline.url ? (
          <a href={headline.url} target="_blank" rel="noreferrer" title={headline.title} className="block truncate font-serif text-[15px] text-[#241a12] hover:text-[#9c4530] leading-snug">
            {headline.title}
          </a>
        ) : (
          <span title={headline.title} className="block truncate font-serif text-[15px] text-[#241a12] leading-snug">{headline.title}</span>
        )}
        {pending && <span className="ml-3 text-[11px] text-[#7d6a52] align-middle">fetching article...</span>}
        {batchDone && <span className="ml-3 text-[11px] text-[#7a3324] align-middle">✓ summarized — see below</span>}
        {batchError && <span className="ml-3 text-[11px] text-[#9b1c1c] align-middle">✗ failed — see below</span>}
      </div>
    </div>
  );
}

// The full readable summary lives here now, not duplicated inline under
// each headline -- one place to actually read (or skim before hitting
// "Read Aloud"), grouped by the articles you actually picked rather than
// scattered across whichever source sections they came from. Temporary in
// the sense that it's driven entirely by `selected` -- clearing the
// selection clears this section too, nothing persisted.
function SelectedSummariesPanel({
  items,
}: {
  items: { id: string; site: string; headline: Headline; result: SummaryResult | undefined }[];
}) {
  if (!items.length) return null;
  return (
    <section className="mt-10 pt-6 border-t-2 border-[#7a3324]/40">
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="font-serif text-2xl text-[#7a3324]">Selected Articles</h2>
        <span className="text-[11px] uppercase tracking-widest text-[#7d6a52]">{items.length} selected</span>
      </div>
      <p className="text-[11px] text-[#7d6a52] mb-4">Clears when you clear your selection above.</p>
      <div className="flex flex-col gap-4">
        {items.map(({ id, site, headline, result }) => (
          <div key={id} className="pb-4 border-b border-[#00000014] last:border-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-[#7d6a52] shrink-0">{site}</span>
              <a href={headline.url} target="_blank" rel="noreferrer" className="font-serif text-[15px] text-[#241a12] hover:text-[#9c4530] leading-snug">
                {headline.title}
              </a>
            </div>
            {result?.status === "pending" && <p className="mt-1 text-[12px] text-[#7d6a52]">fetching article...</p>}
            {result?.status === "done" && <p className="mt-1 text-[13px] text-[#241a12] whitespace-pre-wrap font-serif">{result.summary}</p>}
            {result?.status === "error" && <p className="mt-1 text-xs text-[#9b1c1c]">{result.error}</p>}
            {!result && <p className="mt-1 text-[12px] text-[#7d6a52] italic">Not summarized yet — hit &quot;Get Summaries&quot; below.</p>}
          </div>
        ))}
      </div>
    </section>
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
    <span className={`shrink-0 text-[10px] ${late ? "text-[#f0426a]" : "text-[#7d6a52]"}`}>{text}</span>
  );
}

function SourceToggle({
  site,
  headlines,
  stale,
  selected,
  results,
  onToggleSelect,
  open,
  onToggle,
}: {
  site: string;
  headlines: Headline[];
  stale: boolean;
  selected: Set<string>;
  results: Map<string, SummaryResult>;
  onToggleSelect: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}) {
  // Lifted to the parent (openSites) so an "expand all"/"collapse all" pill
  // can control every source in the active section at once -- this can no
  // longer be a local useState.
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
        onClick={() => !empty && onToggle()}
        disabled={empty}
        className={`w-full flex items-center justify-between gap-2 text-left mb-1 ${empty ? "opacity-40 cursor-default" : ""}`}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-[14px] font-bold uppercase tracking-wide text-[#7d6a52]">{site}</span>
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
        <span className="text-[11px] text-[#7d6a52] shrink-0">({headlines.length}){!empty && ` ${open ? "−" : "+"}`}</span>
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
    <div className="border-b border-[#00000014] last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 py-2 text-left"
      >
        <span className="text-[13px] font-medium text-[#241a12]">{name}</span>
        <span className="text-[11px] text-[#7d6a52] shrink-0">{tasks.length} · {open ? "−" : "+"}</span>
      </button>
      {open && (
        <ul className="pb-2 space-y-1.5">
          {tasks.map((t: any) => (
            <li key={t.id} className="flex items-start gap-2 text-[12px] text-[#241a12]">
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
  voice,
  onVoiceChange,
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
  voice: string;
  onVoiceChange: (v: string) => void;
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
      <div className="pointer-events-auto w-full max-w-[700px] bg-[#f8f1e0] border border-[#7a3324]/40 rounded-t-xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-serif text-[14px] text-[#7a3324]">{selectedCount} selected</span>
          <button
            onClick={onGetSummaries}
            disabled={batchRunning}
            className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded bg-[#7a3324]/10 border border-[#7a3324] text-[#7a3324] hover:bg-[#7a3324]/20 disabled:opacity-40"
          >
            {batchRunning ? "Summarizing..." : "Get Summaries"}
          </button>
          {queue.length > 0 && (
            <>
              <select
                value={voice}
                onChange={(e) => onVoiceChange(e.target.value)}
                disabled={readState !== "idle"}
                title="Read-aloud voice"
                className="text-[11px] px-2 py-1.5 rounded bg-[#f8f1e0] border border-[#00000020] text-[#241a12] disabled:opacity-40"
              >
                {TTS_VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
              {readState === "playing" ? (
                <button onClick={onPause} className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded border border-[#00000020] text-[#241a12] hover:text-[#7a3324]">
                  Pause
                </button>
              ) : (
                <button onClick={onPlay} className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded border border-[#00000020] text-[#241a12] hover:text-[#7a3324]">
                  {readState === "paused" ? "Resume" : "Read Aloud"}
                </button>
              )}
              {readState !== "idle" && (
                <>
                  <button onClick={onSkip} className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded border border-[#00000020] text-[#241a12] hover:text-[#7a3324]">
                    Skip
                  </button>
                  <button onClick={onStop} className="text-[11px] uppercase tracking-widest px-3 py-1.5 rounded border border-[#00000020] text-[#241a12] hover:text-[#7a3324]">
                    Stop
                  </button>
                </>
              )}
            </>
          )}
          <button onClick={onClear} className="ml-auto text-[11px] text-[#7d6a52] hover:text-[#241a12] underline">
            Clear
          </button>
        </div>
        {readState !== "idle" && queue[readIndex] && (
          <p className="text-[11px] text-[#7d6a52]">
            Now reading {readIndex + 1} of {queue.length}: {queue[readIndex].site} -- {queue[readIndex].headline.title}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MorningReviewView() {
  const [journal, setJournal] = useState<{ content: string; entryDatetime: string } | null>(null);
  const [tasksByProject, setTasksByProject] = useState<Record<string, any[]> | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [siteSections, setSiteSections] = useState<SiteSection[]>([]);
  const [roundupDate, setRoundupDate] = useState<string | null>(null);
  const [staleSites, setStaleSites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  // Pill-nav'd single section, not a scroller -- Traditional (RSS) first
  // since NEWS_SECTIONS already lists it first (src/data/newsWatchlist.js).
  const [activeSection, setActiveSection] = useState(0);
  // Which sources are expanded, by site name -- lifted out of SourceToggle
  // (was a local useState there) so the expand-all/collapse-all pill can
  // drive every source in the active section at once. Keyed globally (not
  // per-section) so expand state is remembered if you switch sections and
  // come back.
  const [openSites, setOpenSites] = useState<Set<string>>(new Set());
  const toggleSiteOpen = (site: string) =>
    setOpenSites((prev) => {
      const next = new Set(prev);
      if (next.has(site)) next.delete(site);
      else next.add(site);
      return next;
    });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, SummaryResult>>(new Map());
  const [batchRunning, setBatchRunning] = useState(false);
  const [readState, setReadState] = useState<"idle" | "playing" | "paused">("idle");
  const [readIndex, setReadIndex] = useState(0);
  const [voice, setVoice] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_TTS_VOICE;
    try { return window.localStorage.getItem(TTS_VOICE_KEY) || DEFAULT_TTS_VOICE; } catch { return DEFAULT_TTS_VOICE; }
  });
  const updateVoice = (v: string) => {
    setVoice(v);
    try { window.localStorage.setItem(TTS_VOICE_KEY, v); } catch { /* per-viewer convenience only */ }
  };
  // Real <audio> playback via Hermes' /tts endpoint, not the browser's own
  // (often robotic, inconsistent-quality) built-in voice. Not rendered
  // visibly -- just needs to exist in the DOM for playback.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // index (into readQueue) -> already-synthesized object URL, so the NEXT
  // item is ready by the time the current one finishes speaking (10-20+s of
  // playback is plenty of time to synthesize ~0.5-1s of audio in the
  // background) -- only the very first item in a queue pays synthesis
  // latency up front.
  const audioCacheRef = useRef<Map<number, string>>(new Map());
  const prefetchingRef = useRef<Set<number>>(new Set());
  // Invalidates in-flight playback continuations on stop/skip/restart, so a
  // stale async callback from a superseded play doesn't resurrect itself.
  const playGenRef = useRef(0);

  const clearAudioCache = () => {
    audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    audioCacheRef.current.clear();
    prefetchingRef.current.clear();
  };

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

  // Drives both the expand-all/collapse-all pill (in the header row) and
  // the source list below it -- computed once here rather than twice.
  const currentSites = grouped[activeSection]?.sites ?? [];
  const allSourcesOpen = currentSites.length > 0 && currentSites.every((s) => openSites.has(s.site));
  const toggleAllCurrentSites = () =>
    setOpenSites((prev) => {
      const next = new Set(prev);
      currentSites.forEach((s) => (allSourcesOpen ? next.delete(s.site) : next.add(s.site)));
      return next;
    });

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

  // Every selected headline regardless of summary status (pending/done/
  // error/not-yet-requested) -- feeds the "Selected Articles" section, which
  // is meant to show the whole selection's progress, not just finished ones.
  const selectedItems = allSelectableHeadlines
    .filter(({ id }) => selected.has(id))
    .map(({ id, site, headline }) => ({ id, site, headline, result: results.get(id) }));

  const utteranceTextFor = (item: QueueItem) => `${item.site}. ${item.headline.title}. ${item.summary}`;

  // Returns a playable object URL for queue index i, synthesizing on demand
  // if it wasn't already prefetched. null on failure (caller skips ahead
  // rather than stalling the whole queue on one bad TTS call).
  const getOrSynthesize = async (i: number): Promise<string | null> => {
    if (i < 0 || i >= readQueue.length) return null;
    const cached = audioCacheRef.current.get(i);
    if (cached) return cached;
    try {
      const url = await synthesizeSpeech(utteranceTextFor(readQueue[i]), voice);
      audioCacheRef.current.set(i, url);
      return url;
    } catch {
      return null;
    }
  };

  // Fire-and-forget: get the NEXT item ready while the current one plays.
  const prefetchNext = (i: number) => {
    const next = i + 1;
    if (next >= readQueue.length) return;
    if (audioCacheRef.current.has(next) || prefetchingRef.current.has(next)) return;
    prefetchingRef.current.add(next);
    synthesizeSpeech(utteranceTextFor(readQueue[next]), voice)
      .then((url) => { audioCacheRef.current.set(next, url); })
      .catch(() => { /* will just synthesize on demand when actually reached */ })
      .finally(() => { prefetchingRef.current.delete(next); });
  };

  const speakFrom = (startAt: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const gen = ++playGenRef.current;
    let i = startAt;

    const playNext = async () => {
      if (gen !== playGenRef.current) return; // superseded by a newer play/skip/stop
      if (i >= readQueue.length) {
        setReadState("idle");
        setReadIndex(0);
        return;
      }
      setReadIndex(i);
      const url = await getOrSynthesize(i);
      if (gen !== playGenRef.current) return;
      if (!url) {
        i += 1;
        playNext();
        return;
      }
      prefetchNext(i);
      audio.src = url;
      audio.onended = () => { if (gen === playGenRef.current) { i += 1; playNext(); } };
      audio.onerror = () => { if (gen === playGenRef.current) { i += 1; playNext(); } };
      try {
        await audio.play();
      } catch {
        if (gen === playGenRef.current) { i += 1; playNext(); }
      }
    };

    setReadState("playing");
    playNext();
  };

  const handlePlay = () => {
    if (readState === "paused") {
      audioRef.current?.play();
      setReadState("playing");
    } else {
      speakFrom(0);
    }
  };
  const handlePause = () => {
    audioRef.current?.pause();
    setReadState("paused");
  };
  const handleSkip = () => speakFrom(readIndex + 1);
  const handleStop = () => {
    playGenRef.current += 1; // invalidate any in-flight continuation
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    clearAudioCache();
    setReadState("idle");
    setReadIndex(0);
  };

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      playGenRef.current += 1;
      audio?.pause();
      clearAudioCache();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#efe0c3]">
      <div className="text-[#241a12] px-4 py-8 max-w-5xl mx-auto">
        {/* masthead */}
        <div className="text-center border-b-2 border-[#7a3324]/40 pb-4 mb-8">
          <h1 className="font-serif text-4xl tracking-tight text-[#7a3324]">Morning Review</h1>
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#7d6a52] mt-2">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {loading && <p className="text-[#7d6a52] text-center">Loading...</p>}

        {/* Tasks (1/3) + Journal (2/3) */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <section className="md:col-span-1 bg-[#f8f1e0] rounded-xl border border-[#7a3324]/40 p-4">
            <h2 className="font-serif text-lg text-[#7a3324] mb-1">Open Tasks by Project</h2>
            <p className="text-[10px] uppercase tracking-widest text-[#7d6a52] mb-2">tap a project to expand</p>
            {tasksError && <p className="text-sm text-[#9b1c1c]">{tasksError}</p>}
            {tasksByProject &&
              Object.entries(tasksByProject)
                .sort(([a], [b]) => (a === "ToDos" ? -1 : b === "ToDos" ? 1 : a.localeCompare(b)))
                .map(([project, tasks]) => <ProjectToggle key={project} name={project} tasks={tasks} />)}
          </section>

          <section className="md:col-span-2 bg-[#f8f1e0] rounded-xl border border-[#7a3324]/40 p-4">
            <h2 className="font-serif text-lg text-[#7a3324] mb-1">Last Journal Entry</h2>
            {journal ? (
              <>
                <p className="text-xs text-[#7d6a52] mb-2">{new Date(journal.entryDatetime).toLocaleString()}</p>
                <p className="text-[14px] text-[#241a12] whitespace-pre-wrap font-serif leading-relaxed">{journal.content}</p>
              </>
            ) : (
              !loading && <p className="text-sm text-[#7d6a52]">No recent journal entry.</p>
            )}
          </section>
        </div>

        {/* News Roundup -- pill nav picks one category, shown as a single
            full-width column (not a scroller, not a 2-col grid). Traditional
            (RSS) first since NEWS_SECTIONS lists it first. */}
        <section>
          <div className="flex items-baseline gap-3 border-b-2 border-[#7a3324]/40 pb-2">
            <h2 className="font-serif text-2xl text-[#7a3324]">News Roundup</h2>
            {roundupDate && <span className="text-[11px] uppercase tracking-widest text-[#7d6a52]">{roundupDate}</span>}
          </div>
          {!loading && grouped.length === 0 && <p className="text-sm text-[#7d6a52]">No roundup yet.</p>}
          {grouped.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-2 mb-6 px-3 py-2.5 bg-[#7a3324]/10 border-b border-[#7a3324]/25">
                <button
                  onClick={() => setActiveSection((i) => Math.max(0, i - 1))}
                  disabled={activeSection === 0}
                  aria-label="Previous category"
                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full border border-[#7a3324]/30 text-[#7a3324] hover:border-[#7a3324] disabled:opacity-30 disabled:hover:border-[#7a3324]/30"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="flex-1 flex items-center justify-center gap-6 overflow-x-auto">
                  {grouped.map(({ section }, i) => (
                    <button
                      key={section}
                      onClick={() => setActiveSection(i)}
                      className={`shrink-0 text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                        i === activeSection
                          ? "bg-[#7a3324] border-[#7a3324] text-[#f8f1e0]"
                          : "border-[#7a3324]/30 text-[#7a3324]/70 hover:border-[#7a3324]"
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                  <button
                    onClick={toggleAllCurrentSites}
                    title={allSourcesOpen ? "Collapse all" : "Expand all"}
                    aria-label={allSourcesOpen ? "Collapse all" : "Expand all"}
                    className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full border border-[#7a3324]/30 text-[#7a3324] hover:border-[#7a3324] text-[15px] leading-none"
                  >
                    {allSourcesOpen ? "−" : "+"}
                  </button>
                </div>
                <button
                  onClick={() => setActiveSection((i) => Math.min(grouped.length - 1, i + 1))}
                  disabled={activeSection === grouped.length - 1}
                  aria-label="Next category"
                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full border border-[#7a3324]/30 text-[#7a3324] hover:border-[#7a3324] disabled:opacity-30 disabled:hover:border-[#7a3324]/30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {currentSites.map((s) => {
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
                      open={openSites.has(s.site)}
                      onToggle={() => toggleSiteOpen(s.site)}
                    />
                  );
                })}
              </div>
            </>
          )}
        </section>

        {selected.size > 0 && <SelectedSummariesPanel items={selectedItems} />}
      </div>

      {/* Not rendered visibly -- just needs to exist for <audio> playback. */}
      <audio ref={audioRef} className="hidden" />

      {selected.size > 0 && (
        <BatchActionBar
          selectedCount={selected.size}
          batchRunning={batchRunning}
          onGetSummaries={runBatchSummaries}
          onClear={() => {
            handleStop();
            setSelected(new Set());
          }}
          voice={voice}
          onVoiceChange={updateVoice}
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
