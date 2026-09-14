// Structured mirror of 0.Agents/Hermes/roadmap.md -- that file is the real,
// dated, detailed record (1600+ lines of prose); this is a curated summary
// for the /architecture page's board. Keep in sync by hand when roadmap.md
// changes shape, same pattern as fitnessProgram.js mirroring the Mongo
// fitness_program doc. Not auto-generated.
//
// status: "done" | "in_progress" | "planned"

export const ROADMAP_UPDATED = "2026-09-14";

export const roadmapItems = [
  // ---- Hermes core ----
  { area: "Hermes core", status: "done", title: "Model re-evaluation", note: "6 candidates tested across 2 rounds; gpt-oss-high-full:20b confirmed as root model" },
  { area: "Hermes core", status: "done", title: "News roundup fixed", note: "cron multi-step tool-calling was fabricating tool calls as text; bypassed with a deterministic --no-agent script" },
  { area: "Hermes core", status: "done", title: "Security review + site-wide login gate", note: "public API-server toolset leak found + fixed; icon/color puzzle gate with server-enforced lockout" },
  { area: "Hermes core", status: "done", title: "Personal knowledge graph", note: "Obsidian vault + skill + nightly cron, built from the same Mongo data" },
  { area: "Hermes core", status: "done", title: "qwen3-coder-64k:30b as delegation model", note: "kept, now the backbone of the Coder profile's real-time coding -- earlier keep-or-revert flag resolved by adoption" },
  { area: "Hermes core", status: "done", title: "Google plugin -- calendar, Gmail, Docs, Sheets, Drive", note: "22 tools, live-tested end-to-end; started cli-only, widened to the webapp chat 2026-09-14" },
  { area: "Hermes core", status: "done", title: "Linear migrated to direct GraphQL", note: "dropped the @schpet/linear-cli subprocess wrapper (Windows shell=True fragility) -- same transport pattern the webapp always used" },
  { area: "Hermes core", status: "done", title: "workout_log fabrication bug fixed", note: "an all-null cardio payload was silently accepted as a real entry while the model narrated a saved value -- root-caused via direct Mongo verification, not chat narration" },
  { area: "Hermes core", status: "done", title: "propose_site_change / proposal_list tools", note: "Hermes has no code/deploy tool -- logs a reviewable proposal instead of fabricating success or refusing" },
  { area: "Hermes core", status: "done", title: "Webapp chat toolset widened to full capability", note: "api_server grew from [memory, web, linear] to add google/news/stocks/session_search/webpage/vision/image_gen -- execution-class tools (terminal, code_execution, delegate_task, etc) deliberately still excluded as standing policy, not a temporary step" },
  { area: "Hermes core", status: "in_progress", title: "Two-profile Assistant/Coder architecture", note: "real-time code changes in a live chat conversation -- content_edit plugin + profiles/coder/ + command allowlist + device pairing built; Signal-alert notifications on hold, end-to-end live test not yet run" },
  { area: "Hermes core", status: "in_progress", title: "Knowledge-graph cron", note: "still broken -- same multi-step tool-calling failure as news_roundup had; fix planned (split into chained jobs), not built" },
  { area: "Hermes core", status: "planned", title: "4 Agent Functions", note: "financial assistant, events finder, job-posting roundup, Sunday weekly review -- none designed yet" },
  { area: "Hermes core", status: "planned", title: "Mobile / voice access", note: "captured as a destination, not designed" },

  // ---- Webapp: data unification ----
  { area: "Webapp", status: "done", title: "Linear -- single source for tasks + projects", note: "webapp + Hermes both read/write the same Linear data directly, no gateway round-trip for reads" },
  { area: "Webapp", status: "done", title: "Journal merge", note: "Daily Check-In writes into Hermes' own journal collection -- one place for entries from chat and from the check-in" },
  { area: "Webapp", status: "done", title: "Workouts unified on Hermes collections", note: "retired the standalone Workouts mega-doc; 46 real entries migrated with true historical dates" },
  { area: "Webapp", status: "done", title: "Calendar merge fix", note: "future-only merge drops 178 stale pre-sync Mongo entries, keeps real not-yet-synced ones" },
  { area: "Webapp", status: "done", title: "Vercel LINEAR_API_KEY misconfiguration", note: "the env var's name had gotten set to the key value itself -- found via prod logs, fixed" },
  { area: "Webapp", status: "done", title: "Next.js security upgrade", note: "15.5.25, resolved critical/high vulnerabilities" },
  { area: "Webapp", status: "done", title: "Homepage redesign", note: "\"mission control\" visual system -- mc-panel/mc-row/mc-label, IBM Plex Mono, cyan signal + semantic status colours" },
  { area: "Webapp", status: "done", title: "/workouts full rebuild", note: "2-program calendar (Full Body Baddie 1-week, Original Full Body 14-day A/B/C/D) -- day-click shelf shows prescribed exercises merged with logged actuals, not just history" },
  { area: "Webapp", status: "done", title: "Site-change proposal review UI", note: "ProposalsPanel on the homepage -- surfaces pending_site_changes, decoupled from the chat transcript by design" },

  // ---- Webapp: planned ----
  { area: "Webapp", status: "planned", title: "Progress avatar", note: "ComfyUI-only route -- 5 physique tiers x 2 views, muscle-region heatmap, ties into the existing image-pipeline design below" },
  { area: "Webapp", status: "planned", title: "Hermes-plugin parity for workouts", note: "RIR field on workout_log still genuinely missing (checked directly against the plugin source, not assumed) -- ROM is not a gap, dropped by explicit decision" },
  { area: "Webapp", status: "planned", title: "Phase-aware weekly volume", note: "replace the flat \"8 sets each\" target with Establish/Push/Deload-aware glute-set volume" },
  { area: "Webapp", status: "planned", title: "Homepage workout widgets restyle", note: "WeeklyGoalsSummary / OneRepMaxChart / DailyWorkoutChart still slate-styled, not mc" },
  { area: "Webapp", status: "planned", title: "Webapp long-running-turn fix", note: "direct streaming for chat turns -- Vercel Hobby's real ceiling is 60s, a real tool-using turn measured 83s" },
  { area: "Webapp", status: "planned", title: "This page becomes the canonical source", note: "roadmap.md/ARCHITECTURE.md currently authored by hand and mirrored here -- direction is for this page to become the real home for both, not just a summary of them" },

  // ---- Media pipeline ----
  { area: "Media pipeline", status: "in_progress", title: "ComfyUI image pipeline", note: "FLUX.1 Krea dev + PuLID-FLUX identity + physique LoRA + ControlNet pose-lock -- designed 2026-09-07, not built. Feeds both the old workout-page video plan and the new progress avatar." },
  { area: "Media pipeline", status: "planned", title: "prompt-forge skill", note: "Hermes skill for writing image/video generation prompts, supports the pipeline above" },

  // ---- Housekeeping ----
  { area: "Housekeeping", status: "planned", title: "Codebase cleanup list", note: "compiled from an earlier full-repo review, never executed" },
  { area: "Housekeeping", status: "done", title: "GitHub Dependabot re-check", note: "4 alerts (2 high, 2 moderate), all one root cause -- postcss bundled inside next's own node_modules. Fixed by upgrading next 15.5.25 -> 16.3.5 (semver-major); npm audit now clean" },
  { area: "Housekeeping", status: "done", title: "Test-data cleanup, round 2", note: "ran clean, 0/0/0 -- those entries were already gone from an earlier pass" },
];

export const roadmapAreas = [...new Set(roadmapItems.map((i) => i.area))];
