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
      { name: "Delegation model", detail: "qwen3-coder-64k:30b -- Hermes' one subagent target, coding-shaped work only, via delegate_task (its own terminal session)." },
      { name: "Gateway", detail: "OpenAI-compatible HTTP API, persistent local process, exposed publicly via Tailscale Funnel -- this is how the webapp reaches the live agent." },
      { name: "Tools & skills", detail: "Registered tool schemas (built-in + plugins) gated per platform; markdown skills read on demand rather than always loaded." },
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
      { name: "Agent chat", detail: "The homepage widget and language tutor talk to the live Hermes gateway over the Funnel URL -- the only place the webapp actually uses the LLM." },
      { name: "Auth", detail: "Site-wide icon/color login gate -- server-enforced per-IP + global lockout, HMAC-signed session cookie." },
    ],
  },
];
