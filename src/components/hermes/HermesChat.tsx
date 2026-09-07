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
      const res = await fetch("/api/hermes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, systemPrompt }),
      });

      // Errors (bad key, gateway down, etc.) come back as plain JSON, not a
      // stream — handle that case before trying to read an SSE body.
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("text/event-stream")) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong talking to Hermes.");
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
