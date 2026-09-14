"use client";

import React, { useState, useRef, useEffect } from "react";
import { renderMarkdownLite } from "./markdownLite";

type Profile = "assistant" | "coder";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface HermesChatProps {
  title?: string;
  placeholder?: string;
  systemPrompt?: string;
  // Bump this to force a fresh conversation (e.g. when the language tutor's
  // target language changes) without unmounting the whole component. Ignored
  // when persistKey is set (persistence's own load-per-key effect supersedes
  // this wipe-to-empty behavior).
  resetKey?: string | number;
  // When set, the conversation is saved to localStorage under this key and
  // reloaded whenever it changes (e.g. `language-tutor:${language}` gives
  // each language its own resumable thread) or on mount. Omit for a fully
  // ephemeral chat (the homepage's "Ask Hermes" widget, unchanged).
  persistKey?: string;
  emptyState?: React.ReactNode;
  // The Assistant/Coder profile toggle only makes sense where "Coder" (file
  // and terminal changes to this app's own codebase) is a relevant option —
  // not e.g. the language tutor. Defaults to shown, matching prior behavior.
  showProfileToggle?: boolean;
}

// Persisted shape adds a per-message timestamp so stale turns (>7 days) can
// be dropped automatically; the timestamp never leaves the browser (stripped
// before messages are sent to the gateway).
interface StoredMessage extends ChatMessage {
  ts: number;
}

const PRUNE_MS = 7 * 24 * 60 * 60 * 1000; // auto-delete messages older than this
const storageKey = (key: string) => `hermes-chat:${key}`;

function pruneOld(stored: StoredMessage[]): StoredMessage[] {
  const cutoff = Date.now() - PRUNE_MS;
  return stored.filter((m) => m.ts >= cutoff);
}

// Direct-to-gateway chat token, minted by /api/hermes/token (fast, local
// HMAC signing server-side, no gateway call) and cached across sends so
// every message doesn't need a fresh mint. Refreshed automatically once
// within REFRESH_BUFFER_MS of expiry. See browser_proxy/proxy.py and
// ARCHITECTURE.md Key Decisions #8 for why this exists: talking to
// /api/hermes (a Vercel serverless function) put a hard 60s ceiling on every
// chat turn; talking directly to the gateway over Tailscale Funnel has none.
interface DirectChatToken {
  token: string;
  expiresAt: number; // ms epoch
  proxyUrl: string;
}

const REFRESH_BUFFER_MS = 60_000; // re-mint if within 60s of expiry
let cachedToken: DirectChatToken | null = null; // shared across component instances on this page

async function getDirectChatToken(): Promise<DirectChatToken> {
  if (cachedToken && cachedToken.expiresAt - Date.now() > REFRESH_BUFFER_MS) {
    return cachedToken;
  }
  const res = await fetch("/api/hermes/token", { method: "POST" });
  if (!res.ok) {
    // Distinguish the real causes instead of one vague message — status
    // alone tells you which: 401 = not logged in (or session expired),
    // 500 = server misconfigured (e.g. HERMES_PROXY_TOKEN_SECRET missing),
    // anything else = something unexpected worth seeing verbatim.
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) detail = String(body.error);
    } catch {
      // body wasn't JSON — status code is still useful on its own
    }
    if (res.status === 401) {
      throw new Error("Not logged in — go to /login and sign back in.");
    }
    throw new Error(`Could not get a chat token: ${detail}`);
  }
  const data = await res.json();
  cachedToken = { token: data.token, expiresAt: data.expires_at, proxyUrl: data.proxy_url };
  return cachedToken;
}

export default function HermesChat({
  title = "Ask Hermes",
  placeholder = "Type a message...",
  systemPrompt,
  resetKey,
  persistKey,
  emptyState,
  showProfileToggle = true,
}: HermesChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // True once the current turn's first token has arrived — distinguishes
  // "still deciding/using tools" (show the thinking indicator) from
  // "actively streaming a reply" (show the growing bubble instead).
  const [isStreamingReply, setIsStreamingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Index-aligned with `messages` — when a message was created, for the
  // 7-day prune. Not React state: updated in lockstep with setMessages calls,
  // never read for rendering.
  const tsRef = useRef<number[]>([]);

  const persist = (msgs: ChatMessage[]) => {
    if (!persistKey) return;
    try {
      const stored: StoredMessage[] = msgs.map((m, i) => ({ ...m, ts: tsRef.current[i] ?? Date.now() }));
      localStorage.setItem(storageKey(persistKey), JSON.stringify(pruneOld(stored)));
    } catch {
      /* private browsing, storage full, etc. — never let this break the chat itself */
    }
  };

  const clearPersisted = () => {
    if (!persistKey) return;
    try {
      localStorage.removeItem(storageKey(persistKey));
    } catch {
      /* ignore */
    }
    tsRef.current = [];
    setMessages([]);
    setError(null);
  };

  // Profile toggle (proposal-worker-pipeline.md Part B). Switching is pure
  // client-side routing -- the multiplexed gateway serves both profiles
  // from the same process/token, just at a different URL prefix (Part A).
  // No server round-trip needed to "switch"; the next message sent just
  // goes to a different path.
  const [profile, setProfile] = useState<Profile>("assistant");
  const [pairedDeviceId, setPairedDeviceId] = useState<string | null>(null);
  const [checkingPairing, setCheckingPairing] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  const checkPairing = async () => {
    try {
      const res = await fetch("/api/devices");
      if (!res.ok) return;
      const data = await res.json();
      setPairedDeviceId(data.thisDeviceId || null);
    } catch {
      // Silent -- pairing check failing just means the toggle offers to
      // pair again; it's not itself a user-facing error state.
    }
  };

  useEffect(() => {
    checkPairing();
  }, []);

  const announceCoderSwitch = () => {
    tsRef.current = [...tsRef.current, Date.now()];
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "_Switched to Coder — qwen3-coder-64k:30b active. File/terminal changes are scoped to new.myapp and require live approval for anything outside the safe-command list._",
      },
    ]);
  };

  // Shared by the toggle button and the "Switch to Coder & continue" event
  // from ProposalsPanel -- pairs this device first if it isn't paired yet
  // (offering rather than silently refusing), then activates Coder and
  // optionally pre-fills the input with a proposal's description.
  const activateCoderMode = async (prefillText?: string) => {
    if (!pairedDeviceId) {
      const label = window.prompt("Name this device (e.g. \"Legion laptop\", \"iPhone\"):", "");
      if (label === null) return; // cancelled
      setCheckingPairing(true);
      setPairingError(null);
      try {
        const res = await fetch("/api/devices/pair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label }),
        });
        const data = await res.json();
        if (!res.ok) {
          setPairingError(data?.error || "Pairing failed.");
          return;
        }
        setPairedDeviceId(data.deviceId);
      } catch {
        setPairingError("Network error while pairing this device.");
        return;
      } finally {
        setCheckingPairing(false);
      }
    }
    setProfile("coder");
    announceCoderSwitch();
    if (prefillText) setInput(prefillText);
  };

  const handleToggleProfile = (next: Profile) => {
    if (isLoading) return;
    if (next === "coder") {
      activateCoderMode();
      return;
    }
    setProfile("assistant");
    tsRef.current = [...tsRef.current, Date.now()];
    setMessages((prev) => [...prev, { role: "assistant", content: "_Switched to Assistant._" }]);
  };

  // Fired by ProposalsPanel's "Switch to Coder & continue" button -- same
  // pending_site_changes doc, just handed off instead of a worker consuming
  // it (proposal-worker-pipeline.md Part A: the async worker is gone).
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text;
      activateCoderMode(text);
    };
    window.addEventListener("hermes:switch-to-coder", handler);
    return () => window.removeEventListener("hermes:switch-to-coder", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairedDeviceId]);

  // Load (and prune) the persisted thread whenever persistKey changes (e.g.
  // tutor language switch resumes THAT language's own history); with no
  // persistKey, fall back to the original reset-on-resetKey wipe-to-empty.
  useEffect(() => {
    if (!persistKey) {
      tsRef.current = [];
      setMessages([]);
      setError(null);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(persistKey));
      const stored: StoredMessage[] = raw ? JSON.parse(raw) : [];
      const pruned = pruneOld(stored);
      if (pruned.length !== stored.length) {
        localStorage.setItem(storageKey(persistKey), JSON.stringify(pruned));
      }
      tsRef.current = pruned.map((m) => m.ts);
      setMessages(pruned.map(({ ts, ...rest }) => rest));
    } catch {
      tsRef.current = [];
      setMessages([]);
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey, resetKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    tsRef.current = [...tsRef.current, Date.now()];
    setMessages(nextMessages);
    persist(nextMessages);
    setInput("");
    setIsLoading(true);
    setIsStreamingReply(false);
    setError(null);

    try {
      let chatToken: DirectChatToken;
      try {
        chatToken = await getDirectChatToken();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not get a chat token.");
        return;
      }

      // Ephemeral system prompt layered on top of Hermes' own persona by the
      // gateway itself, same as the old /api/hermes route did server-side —
      // replicated here since that route is no longer in the chat path.
      const outgoingMessages = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...nextMessages]
        : nextMessages;

      // Multiplexed gateway: the default/assistant profile answers at the
      // bare path, coder at /p/coder/... (gateway.multiplex_profiles in
      // Hermes' config.yaml). Same token/bearer key for both -- multiplex
      // mode is one gateway process serving several profiles, not several
      // separately-authed servers.
      const chatPath = profile === "coder" ? "/p/coder/v1/chat/completions" : "/v1/chat/completions";

      let res: Response;
      try {
        res = await fetch(`${chatToken.proxyUrl}${chatPath}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${chatToken.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: "hermes-agent", messages: outgoingMessages, stream: true }),
        });
      } catch {
        // Laptop asleep, Tailscale down, etc. — a real, honest failure mode
        // of routing straight to a local machine (see ARCHITECTURE.md Key
        // Decisions #8), not something to paper over with a vague retry.
        setError("Hermes is unreachable right now (the machine it runs on may be offline).");
        return;
      }

      // Errors (bad/expired token, gateway down, etc.) come back as plain
      // JSON, not a stream — handle that case before trying to read an SSE
      // body.
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("text/event-stream")) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message || data?.error || "Something went wrong talking to Hermes.");
        return;
      }

      if (!res.body) {
        setError("No response body from Hermes.");
        return;
      }

      // Placeholder assistant bubble, filled in as tokens stream in. Hermes'
      // tool loop can go quiet for a long stretch between calls (deciding to
      // use a tool, running it) before any visible content starts — the
      // "thinking" indicator below covers that gap; this bubble appears the
      // moment the first real token arrives.
      let assistantContent = "";
      let started = false;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const line = rawEvent.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              if (!started) {
                started = true;
                setIsStreamingReply(true);
                tsRef.current = [...tsRef.current, Date.now()];
                setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
              } else {
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantContent };
                  return next;
                });
              }
            }
          } catch (parseErr) {
            console.error("Failed to parse SSE chunk:", parseErr, payload);
          }
        }
      }

      if (!started) {
        setError("Hermes returned no response.");
      } else {
        persist([...nextMessages, { role: "assistant", content: assistantContent }]);
      }
    } catch (err) {
      console.error(err);
      setError("Network error reaching Hermes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // This button is a convenience that STARTS the request -- it is not
  // itself the security gate. The coder profile's approvals.mode: manual
  // + command_allowlist (config.yaml, deliberately excludes git push) means
  // the actual push still requires a live approval prompt server-side
  // regardless of how the request was triggered. No client-side check for
  // "was there a successful apply" yet (the plan calls for reading `git
  // log -1`, deferred -- this app has no direct filesystem access to
  // new.myapp's git tree, only the coder profile does) -- available
  // whenever a Coder-mode conversation has happened, not gated on
  // detecting success from the model's own text.
  const commitAndPush = () => {
    sendMessage(
      "Everything looks good — please run git push now for the commit(s) from this session, and report the actual command output."
    );
  };

  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-tr from-black to-slate-800 rounded-xl border border-cyan-800 overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-cyan-900 flex items-center justify-between gap-3">
        <h2 className="text-cyan-300 font-semibold text-lg">{title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          {persistKey && (
            <button
              onClick={clearPersisted}
              disabled={isLoading || messages.length === 0}
              title="Clear this saved conversation"
              className="text-xs px-2.5 py-1 rounded-lg border border-cyan-800 text-slate-400 hover:text-red-400 hover:border-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              Clear
            </button>
          )}
          {showProfileToggle && (
            <div className="flex rounded-lg overflow-hidden border border-cyan-800 text-xs shrink-0">
              <button
                onClick={() => handleToggleProfile("assistant")}
                disabled={isLoading || checkingPairing}
                className={`px-2.5 py-1 font-medium transition-colors ${
                  profile === "assistant" ? "bg-cyan-700 text-white" : "bg-slate-900 text-slate-400 hover:text-cyan-300"
                } disabled:opacity-50`}
              >
                Assistant
              </button>
              <button
                onClick={() => handleToggleProfile("coder")}
                disabled={isLoading || checkingPairing}
                title={!pairedDeviceId ? "This device isn't paired yet — click to pair" : undefined}
                className={`px-2.5 py-1 font-medium transition-colors ${
                  profile === "coder" ? "bg-amber-600 text-white" : "bg-slate-900 text-slate-400 hover:text-amber-300"
                } disabled:opacity-50`}
              >
                {checkingPairing ? "Pairing…" : pairedDeviceId ? "Coder" : "Coder 🔒"}
              </button>
            </div>
          )}
        </div>
      </div>
      {pairingError && (
        <div className="px-4 py-1.5 text-xs text-red-400 border-b border-cyan-900">{pairingError}</div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[240px] max-h-[420px]">
        {messages.length === 0 && !isLoading && (
          <div className="text-slate-400 text-sm italic">
            {emptyState ?? "Say something to get started."}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-cyan-700 text-white"
                  : "bg-slate-700 text-cyan-100"
              }`}
            >
              {m.role === "assistant" ? renderMarkdownLite(m.content) : m.content}
            </div>
          </div>
        ))}
        {isLoading && !isStreamingReply && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-slate-700 text-cyan-300 italic">
              Hermes is thinking...
            </div>
          </div>
        )}
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
      </div>

      <div className="flex items-end gap-2 p-3 border-t border-cyan-900">
        <textarea
          className="flex-1 resize-none rounded-lg bg-slate-900 text-white placeholder-slate-500 px-3 py-2 text-sm border border-cyan-900 focus:outline-none focus:border-cyan-500"
          rows={1}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 rounded-lg bg-cyan-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-600 transition-colors"
        >
          Send
        </button>
        {profile === "coder" && messages.length > 0 && (
          <button
            onClick={commitAndPush}
            disabled={isLoading}
            title="Sends a push request to Hermes — still requires live approval server-side, this button doesn't push directly"
            className="px-3 py-2 rounded-lg bg-amber-700 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            Commit &amp; Push
          </button>
        )}
      </div>
    </div>
  );
}
