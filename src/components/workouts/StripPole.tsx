"use client";

import React from "react";

/**
 * Vibe piece #1: a silhouette on a pole — slides down, drops into a side
 * split, bounces. Pure SVG + CSS keyframes (baddie.css: .baddie-pole *).
 * One 7s loop, every part timed off it. Under prefers-reduced-motion the
 * animations are dropped and the figure just holds a pose.
 */
export default function StripPole() {
  return (
    <div className="baddie-pole" aria-hidden="true">
      <svg viewBox="0 0 200 300" role="img" aria-label="Animated dancer silhouette on a pole">
        <defs>
          <linearGradient id="baddie-chrome-pole" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8b90ab" />
            <stop offset="0.45" stopColor="#fefeff" />
            <stop offset="0.55" stopColor="#c8ccdf" />
            <stop offset="1" stopColor="#6f7590" />
          </linearGradient>
        </defs>

        <rect className="pole" x="146" y="6" width="7" height="288" rx="3.5" fill="url(#baddie-chrome-pole)" />

        <g className="dancer">
          <g className="hair">
            <path d="M132 20 q-13 7 -9 22 q6 -8 13 -10 z" fill="var(--hot)" />
          </g>
          <circle cx="140" cy="18" r="8" fill="var(--hot)" />
          <path className="armUp" d="M140 26 q8 -6 12 -14" stroke="var(--hot)" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path
            className="torso"
            d="M140 26 C 150 40 148 58 138 74 C 128 88 126 100 134 110
               C 146 122 150 116 150 128 C 150 140 138 142 128 138
               C 116 132 116 116 120 104 C 124 88 122 66 130 48
               C 133 38 136 30 140 26 Z"
            fill="var(--hot)"
          />
          <path className="armFree" d="M132 60 q-14 6 -18 20" stroke="var(--hot)" strokeWidth="6" strokeLinecap="round" fill="none" />

          <g className="booty">
            <ellipse cx="120" cy="126" rx="13" ry="11" fill="var(--hot)" />
          </g>

          <g className="legA">
            <path d="M128 132 q4 34 2 66 q-1 10 -6 12" stroke="var(--hot)" strokeWidth="9" strokeLinecap="round" fill="none" />
          </g>
          <g className="legB">
            <path d="M128 132 q-6 34 -6 66 q0 10 4 12" stroke="var(--hot)" strokeWidth="9" strokeLinecap="round" fill="none" />
          </g>
        </g>
      </svg>
    </div>
  );
}
