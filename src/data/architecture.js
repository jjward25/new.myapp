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
      { name: "Root model", detail: "gpt-oss-high-full:20b, local via Ollama on an RTX 5090 (24GB) -- native 131K context, reasoning_effort: high." },
      { name: "Profiles", detail: "Root model handles judgment work directly -- no delegation. One extra profile exists: Coder (profiles/coder/), its own root model (qwen3-coder-64k:30b), a restricted toolset (file/terminal/content_edit), manual approvals. A deliberate session switch, not an in-loop subagent call." },
      { name: "Gateway", detail: "OpenAI-compatible HTTP API, persistent local process, exposed via Tailscale Funnel -- how the webapp reaches the live agent. Multiplexes the default and Coder profiles from one process." },
      { name: "Tools & skills", detail: "Tools = JSON-schema functions with real side effects (Mongo writes, API calls). Skills = markdown playbooks read on demand, no code runs. The webapp's toolset widened 2026-09-14 to a full assistant surface (calendar, Gmail, Docs/Sheets/Drive, news, stocks, images), while permanently excluding execution-class tools (terminal, code_execution) as standing policy." },
      { name: "Memory & knowledge graph", detail: "MongoDB Atlas is the real retrieval backend -- hybrid search (Atlas lexical + local all-minilm embeddings, RRF-fused). A nightly cron job derives a browsable Obsidian vault from the same data for human use; Hermes never reads from the vault." },
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
      { name: "Linear", detail: "Direct GraphQL client -- same underlying tasks/projects data Hermes' own Linear tools use." },
      { name: "Google Calendar", detail: "Direct REST calls, sharing the same OAuth client + refresh token as Hermes -- one calendar, two consumers." },
      { name: "Agent chat", detail: "Hermes' primary interface -- calendar, Gmail, Docs/Sheets/Drive, news, stocks, tasks, images, all live via chat. A Coder mode switches the conversation model to qwen3-coder for real-time code changes, gated by device pairing beyond the site login." },
      { name: "Site-change proposals", detail: "When a request needs a code/config change Hermes has no tool for, it logs a reviewable proposal instead of fabricating success -- surfaced on the homepage." },
      { name: "Auth", detail: "Site-wide icon/color login gate -- server-enforced per-IP + global lockout, HMAC-signed session cookie. Coder mode and content-file edits require a separately paired device." },
    ],
  },
];
