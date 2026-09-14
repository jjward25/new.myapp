// Structured mirror of 0.Agents/Hermes/ARCHITECTURE.md's "System map" --
// that file is the real reference doc; this drives the /architecture page.
// Keep in sync by hand when the system's shape actually changes.

export const GOVERNING_PRINCIPLE =
  "If the UI is just showing you something, it reads Mongo/Linear/Calendar directly -- no LLM. If you're asking it to decide something, it talks to Hermes.";

export const sides = [
  {
    key: "hermes",
    label: "Hermes -- local agent",
    tagline: "Judgment work: research, summarization, conversation, anything that needs real reasoning.",
    accent: "#22d3ee",
    items: [
      { name: "Root model", detail: "gpt-oss-high-full:20b, local via Ollama on an RTX 5090 (24GB) -- full native 131K context, reasoning_effort: high." },
      { name: "Delegation model", detail: "qwen3-coder-64k:30b -- Hermes' subagent target for coding-shaped work (delegate_task, its own terminal session), and now also runs as the conversation model itself in the Coder profile." },
      { name: "Gateway", detail: "OpenAI-compatible HTTP API, persistent local process, exposed publicly via Tailscale Funnel -- this is how the webapp reaches the live agent. Multiplexes two profiles (Assistant / Coder) from one process." },
      { name: "Tools & skills", detail: "Registered tool schemas (built-in + plugins) gated per platform; markdown skills read on demand rather than always loaded. The webapp's platform (api_server) was narrow (3 toolsets) through 2026-09-13, widened to a full personal-assistant surface 2026-09-14 -- calendar, Gmail, Docs/Sheets/Drive, news, stocks, images -- while permanently excluding execution-class tools (terminal, code_execution, delegate_task) as standing policy." },
      { name: "Memory", detail: "MongoDB Atlas, PersonalAgent db -- hybrid search: Atlas Search lexical + local all-minilm embeddings, fused with RRF." },
      { name: "Knowledge graph", detail: "An Obsidian vault built nightly from the same Mongo data -- a derived, human-facing view, not a second retrieval backend." },
      { name: "Cron", detail: "Hermes' own scheduler -- news roundup, nightly knowledge-graph build." },
    ],
  },
  {
    key: "webapp",
    label: "Webapp -- new.myapp",
    tagline: "Display work: direct reads, no agent in the loop unless you're asking it to decide something.",
    accent: "#35c48b",
    items: [
      { name: "Hosting", detail: "Next.js on Vercel (Hobby tier)." },
      { name: "Shared data", detail: "Reads/writes the same PersonalAgent Mongo db directly -- journal, workouts, benchmarks, routines, calendar cache. Same source, not a copy." },
      { name: "Linear", detail: "A direct GraphQL client -- tasks and projects, the same underlying data Hermes' own Linear tools use." },
      { name: "Google Calendar", detail: "Direct REST calls, sharing the same OAuth client + refresh token as Hermes -- one calendar, two consumers." },
      { name: "Agent chat", detail: "Hermes' primary interface, not a narrow widget -- calendar, Gmail, Docs/Sheets/Drive, news, stocks, tasks, images, all live via chat as of 2026-09-14. A Coder mode switches the conversation model itself to qwen3-coder for real-time code changes, gated by device pairing beyond the site login." },
      { name: "Site-change proposals", detail: "When a request needs a code/config change Hermes has no tool for, it logs a reviewable proposal instead of fabricating success -- surfaced on the homepage, decoupled from the chat transcript." },
      { name: "Auth", detail: "Site-wide icon/color login gate -- server-enforced per-IP + global lockout, HMAC-signed session cookie. Coder mode and content-file edits require a separately paired device on top of this." },
    ],
  },
];
