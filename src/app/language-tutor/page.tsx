"use client";

import React, { useState, useMemo } from "react";
import HermesChat from "@/components/hermes/HermesChat";

const LANGUAGES = [
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Japanese",
  "Mandarin Chinese",
  "Korean",
];

function buildTutorPrompt(language: string) {
  return `You are a friendly, patient language tutor helping the user learn ${language}. The user will write to you in English.

For every message the user sends, reply with exactly these three labeled sections, in this order, and nothing else:

1. Translation: a natural translation of the user's own message into ${language}.
2. English reply: your own conversational reply to what they said, written in English.
3. ${language} reply: that same reply translated into ${language}.

Keep both your English and ${language} replies conversational and reasonably brief — this is a casual back-and-forth conversation, not a lecture. Only correct grammar/vocabulary mistakes if the user asks you to. Do not skip any of the three sections, and do not add extra commentary outside them.`;
}

export default function LanguageTutorPage() {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const systemPrompt = useMemo(() => buildTutorPrompt(language), [language]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:px-24 md:pt-6 w-full h-full">
      <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-cyan-700 mt-6 md:mt-0 mb-6 text-center">
        Language Tutor
      </h1>

      <div className="w-full max-w-2xl flex flex-col gap-4">
        <div className="flex items-center gap-3 bg-cyan-950 rounded-xl px-4 py-3">
          <label htmlFor="language-select" className="text-cyan-300 text-sm font-medium">
            Learning:
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-900 text-white text-sm rounded-lg px-3 py-1.5 border border-cyan-800 focus:outline-none focus:border-cyan-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div className="h-[560px]">
          <HermesChat
            title={`Practice ${language}`}
            placeholder="Say something in English..."
            systemPrompt={systemPrompt}
            resetKey={language}
            emptyState={`Write to me in English — I'll translate it into ${language} and reply in both.`}
          />
        </div>
      </div>
    </main>
  );
}
