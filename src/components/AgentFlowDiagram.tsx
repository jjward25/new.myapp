"use client";

import React from "react";

const INK = "#e7eaee";
const DIM = "#8a919c";
const FAINT = "#5b626d";
const PANEL = "#171a1f";
const LINE = "rgba(255,255,255,0.14)";
const CYAN = "#22d3ee";
const GREEN = "#35c48b";

const monoStyle: React.CSSProperties = { fontFamily: "var(--mc-mono)" };

function Node({
  x,
  y,
  w,
  h,
  label,
  accent,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  accent?: string;
  children?: React.ReactNode;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={PANEL} stroke={accent ?? LINE} strokeWidth={accent ? 1.4 : 1} />
      <text x={x + 12} y={y + 20} fontSize={11} letterSpacing="0.12em" fill={accent ?? DIM} style={monoStyle}>
        {label.toUpperCase()}
      </text>
      {children}
    </g>
  );
}

export default function AgentFlowDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 920 664"
        className="w-full min-w-[560px]"
        style={{ maxWidth: 920 }}
        role="img"
        aria-label="Agent flow: prompt through context aggregation and the tool/skill loop to response"
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={DIM} />
          </marker>
          <marker id="arrowCyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={CYAN} />
          </marker>
        </defs>

        {/* Prompt node */}
        <rect x={360} y={12} width={200} height={44} rx={8} fill={PANEL} stroke={CYAN} strokeWidth={1.6} />
        <text x={460} y={39} fontSize={14} textAnchor="middle" fill={INK} style={monoStyle} letterSpacing="0.15em">
          PROMPT
        </text>

        <line x1={460} y1={56} x2={460} y2={78} stroke={DIM} strokeWidth={1.4} markerEnd="url(#arrow)" />

        {/* Context aggregation box */}
        <Node x={80} y={80} w={760} h={220} label="Context aggregation -- system_prompt.py">
          <text x={92} y={104} fontSize={10} fill={FAINT} style={monoStyle}>
            ordered so the KV-cache prefix stays warm across turns -- stable first, volatile last
          </text>

          {/* Stable tier */}
          <rect x={96} y={116} width={710} height={40} rx={4} fill="#0c0d10" stroke={LINE} />
          <text x={106} y={132} fontSize={11} fill={GREEN} style={monoStyle} letterSpacing="0.08em">
            STABLE
          </text>
          <text x={106} y={148} fontSize={11.5} fill="#c4c9d1">
            SOUL.md identity, core guidance blocks -- unchanged across the whole session
          </text>

          {/* Context tier */}
          <rect x={96} y={162} width={710} height={40} rx={4} fill="#0c0d10" stroke={LINE} />
          <text x={106} y={178} fontSize={11} fill="#f5a623" style={monoStyle} letterSpacing="0.08em">
            CONTEXT
          </text>
          <text x={106} y={194} fontSize={11.5} fill="#c4c9d1">
            cwd / workspace snapshot, active profile, AGENTS.md &amp; CLAUDE.md-style project files
          </text>

          {/* Volatile tier */}
          <rect x={96} y={208} width={710} height={80} rx={4} fill="#0c0d10" stroke={LINE} />
          <text x={106} y={224} fontSize={11} fill={CYAN} style={monoStyle} letterSpacing="0.08em">
            VOLATILE
          </text>
          <text x={106} y={240} fontSize={11.5} fill="#c4c9d1">
            skills index, memory snapshot + prefetch (Mongo hybrid search), USER.md,
          </text>
          <text x={106} y={256} fontSize={11.5} fill="#c4c9d1">
            plugin prompt sections, timestamp -- rebuilt fresh every turn
          </text>
          <text x={106} y={276} fontSize={10.5} fill={FAINT} fontStyle="italic">
            skills live here as plain prose -- nothing executes when this tier is assembled
          </text>
        </Node>

        <line x1={460} y1={300} x2={460} y2={324} stroke={DIM} strokeWidth={1.4} markerEnd="url(#arrow)" />

        {/* Model reasoning loop */}
        <Node x={220} y={326} w={480} h={110} label="Model reasoning loop -- conversation_loop.py" accent={CYAN}>
          <text x={232} y={356} fontSize={11.5} fill="#c4c9d1">
            Reads the assembled prompt + registered tool schemas.
          </text>
          <text x={232} y={374} fontSize={11.5} fill="#c4c9d1">
            Each turn: respond directly, or emit one or more tool calls.
          </text>
          <text x={232} y={398} fontSize={10.5} fill={FAINT} fontStyle="italic">
            skills were already read above -- the model can follow them or ignore them
          </text>
          <text x={232} y={414} fontSize={10.5} fill={FAINT} fontStyle="italic">
            here, they&apos;re a suggestion, not a structural constraint
          </text>
        </Node>

        {/* dashed skills line, from volatile tier back up to the loop, off to the side */}
        <path
          d="M 96 248 C 30 248, 30 380, 220 380"
          fill="none"
          stroke={FAINT}
          strokeWidth={1.2}
          strokeDasharray="4 4"
          markerEnd="url(#arrow)"
        />
        <text x={20} y={230} fontSize={10} fill={FAINT} style={monoStyle} letterSpacing="0.06em">
          SKILLS
        </text>
        <text x={20} y={296} fontSize={9.5} fill={FAINT}>
          (prose,
        </text>
        <text x={20} y={308} fontSize={9.5} fill={FAINT}>
          no exec)
        </text>

        {/* Tool call branch */}
        <line x1={700} y1={381} x2={760} y2={381} stroke={CYAN} strokeWidth={1.4} markerEnd="url(#arrowCyan)" />
        <Node x={762} y={326} w={150} h={110} accent={CYAN} label="Tool call">
          <text x={774} y={356} fontSize={10.5} fill="#c4c9d1">
            JSON schema
          </text>
          <text x={774} y={370} fontSize={10} fill={FAINT}>
            (name, params --
          </text>
          <text x={774} y={382} fontSize={10} fill={FAINT}>
            steers whether
          </text>
          <text x={774} y={394} fontSize={10} fill={FAINT}>
            it&apos;s called)
          </text>
          <line x1={774} y1={402} x2={898} y2={402} stroke={LINE} />
          <text x={774} y={418} fontSize={10.5} fill="#c4c9d1">
            Python function
          </text>
          <text x={774} y={430} fontSize={10} fill={FAINT}>
            (real side effect)
          </text>
        </Node>

        {/* loop-back arrow from tool call back into the model loop */}
        <path
          d="M 837 326 C 837 300, 780 300, 700 300 C 620 300, 600 310, 600 326"
          fill="none"
          stroke={CYAN}
          strokeWidth={1.2}
          strokeDasharray="3 5"
          markerEnd="url(#arrowCyan)"
        />
        <text x={640} y={296} fontSize={9.5} fill={CYAN} style={monoStyle}>
          result appended, loop continues
        </text>

        <line x1={460} y1={436} x2={460} y2={460} stroke={DIM} strokeWidth={1.4} markerEnd="url(#arrow)" />

        {/* Response node */}
        <rect x={360} y={462} width={200} height={44} rx={8} fill={PANEL} stroke={GREEN} strokeWidth={1.6} />
        <text x={460} y={489} fontSize={14} textAnchor="middle" fill={INK} style={monoStyle} letterSpacing="0.15em">
          RESPONSE
        </text>

        {/* Legend */}
        <rect x={80} y={540} width={760} height={108} rx={6} fill="#0c0d10" stroke={LINE} />
        <text x={96} y={562} fontSize={11} fill={FAINT} style={monoStyle} letterSpacing="0.1em">
          SKILLS VS. TOOLS
        </text>
        <text x={96} y={584} fontSize={12} fill="#c4c9d1">
          <tspan fill={FAINT}>Skills</tspan> = pure prose playbooks. A SKILL.md is markdown telling the model how to use existing
        </text>
        <text x={96} y={602} fontSize={12} fill="#c4c9d1">
          tools well. Nothing runs when a skill loads -- it&apos;s read, not executed.
        </text>
        <text x={96} y={624} fontSize={12} fill="#c4c9d1">
          <tspan fill={CYAN}>Tools</tspan> = a JSON schema (name, description, params -- steers whether the model calls it) plus a
        </text>
        <text x={96} y={642} fontSize={12} fill="#c4c9d1">
          Python function underneath. The NL part only decides if it&apos;s called; what happens after is code.
        </text>
      </svg>
    </div>
  );
}
