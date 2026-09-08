"use client";

import React, { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface HermesChatProps {
  title?: string;
  placeholder?: string;
  systemPrompt?: string;
  // Bump this to force a fresh conversation (e.g. when the language tutor's
  // target language changes) without unmounting the whole component.
  resetKey?: string | number;
  emptyState?: React.ReactNode;
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
    throw new Error("Could not get a chat token (are you logged in?)");
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
  emptyState,
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

  // Reset conversation whenever resetKey changes (e.g. tutor language switch)
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [resetKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setIsStreamingReply(false);
    setError(null);

    try {
      let chatToken: DirectChatToken;
      try {
        chatToken = await getDirectChatToken();
      } catch {
        setError("Could not reach Hermes (are you logged in?).");
        return;
      }

      // Ephemeral system prompt layered on top of Hermes' own persona by the
      // gateway itself, same as the old /api/hermes route did server-side —
      // replicated here since that route is no longer in the chat path.
      const outgoingMessages = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...nextMessages]
        : nextMessages;

      let res: Response;
      try {
        res = await fetch(`${chatToken.proxyUrl}/v1/chat/completions`, {
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

  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-tr from-black to-slate-800 rounded-xl border border-cyan-800 overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-cyan-900">
        <h2 className="text-cyan-300 font-semibold text-lg">{title}</h2>
      </div>

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
              {m.content}
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
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 rounded-lg bg-cyan-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-600 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
