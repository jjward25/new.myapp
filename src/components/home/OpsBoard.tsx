"use client";

import React, { useEffect, useMemo, useState } from "react";
import { refreshKPIs } from "@/components/kpis/KPIDashboard";
import { getWeekBoundsEST, getTodayEST } from "@/utils/dateUtils";

/* ------------------------------------------------------------------ */
/* data types                                                          */
/* ------------------------------------------------------------------ */
interface Task {
  _id: string;
  "Task Name": string;
  "Due Date": string | null;
  "Complete Date": string | null;
  Priority: string;
  Type: string;
  Size: string;
  Missed?: boolean;
}
interface Milestone {
  name: string;
  project: string;
  priority: number;
  due: string;
}
interface ListDoc {
  name: string;
  parent?: string | null;
  list: { name: string; done: boolean }[];
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const pClass = (p: string) => {
  const n = String(p).toUpperCase();
  if (n === "P0") return "p-0";
  if (n === "P1") return "p-1";
  if (n === "P2") return "p-2";
  return "";
};
const pRank = (p: string) => ({ P0: 0, P1: 1, P2: 2, P3: 3 }[String(p).toUpperCase()] ?? 4);

function relDue(due: string | null, today: string): { text: string; cls: string } {
  if (!due) return { text: "—", cls: "" };
  const d = new Date(due + "T00:00:00");
  const t = new Date(today + "T00:00:00");
  const days = Math.round((d.getTime() - t.getTime()) / 86_400_000);
  if (days < 0) return { text: `${-days}d late`, cls: "late" };
  if (days === 0) return { text: "today", cls: "today" };
  if (days === 1) return { text: "tomorrow", cls: "" };
  if (days <= 7) return { text: `in ${days}d`, cls: "" };
  return { text: due.slice(5), cls: "" };
}

/* ------------------------------------------------------------------ */
/* lane shell                                                          */
/* ------------------------------------------------------------------ */
const Lane: React.FC<{
  title: string;
  count: number;
  onAdd?: () => void;
  addHref?: string;
  children: React.ReactNode;
}> = ({ title, count, onAdd, addHref, children }) => (
  <div className="mc-panel flex flex-col min-h-[220px] max-h-[440px]">
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.08]">
      <span className="mc-label">{title}</span>
      <span className="mc-mono text-[11px] text-[#5b626d]">{count}</span>
      {addHref ? (
        <a href={addHref} className="ml-auto mc-mono text-[#5b626d] hover:text-[#22d3ee] text-sm leading-none">
          +
        </a>
      ) : (
        <button
          onClick={onAdd}
          className="ml-auto mc-mono text-[#5b626d] hover:text-[#22d3ee] text-sm leading-none"
          aria-label={`Add to ${title}`}
        >
          +
        </button>
      )}
    </div>
    <div className="flex-1 overflow-y-auto px-3 py-1">{children}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* board                                                               */
/* ------------------------------------------------------------------ */
export default function OpsBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [lists, setLists] = useState<ListDoc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  const today = getTodayEST();
  const week = useMemo(() => getWeekBoundsEST(new Date()), []);

  const load = async () => {
    const [b, p, l] = await Promise.all([
      fetch("/api/tasks").then((r) => r.json()).catch(() => []),
      fetch("/api/projects").then((r) => r.json()).catch(() => []),
      fetch("/api/lists").then((r) => r.json()).catch(() => ({ lists: [] })),
    ]);

    setTasks(
      (Array.isArray(b) ? b : [])
        .filter((t: Task) => !t["Complete Date"] && t.Missed !== true && t["Due Date"] && t["Due Date"] <= week.end)
        .sort((a: Task, x: Task) => pRank(a.Priority) - pRank(x.Priority) || String(a["Due Date"]).localeCompare(String(x["Due Date"])))
    );

    const ms: Milestone[] = [];
    (Array.isArray(p) ? p : []).forEach((proj: any) => {
      Object.entries(proj.Milestones || {}).forEach(([name, m]: [string, any]) => {
        if (!m["Complete Date"]) {
          ms.push({
            name,
            project: proj["Project Name"],
            priority: Number(m["Milestone Priority"]) || 3,
            due: m["Due Date"] || "",
          });
        }
      });
    });
    ms.sort((a, b) => a.priority - b.priority || a.project.localeCompare(b.project));
    setMilestones(ms);

    setLists((l?.lists || []).filter((x: ListDoc) => Array.isArray(x.list)));
    setLoaded(true);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completeTask = async (id: string) => {
    setExiting((s) => new Set(s).add(id));
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updatedItem: { "Complete Date": today } }),
      });
    } catch {
      /* keep it visible on failure */
      setExiting((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      return;
    }
    setTimeout(() => {
      setTasks((ts) => ts.filter((t) => t._id !== id));
      refreshKPIs();
    }, 280);
  };

  const [quickTask, setQuickTask] = useState<string | null>(null);
  const addQuickTask = async (name: string) => {
    if (!name.trim()) return;
    const item = {
      "Task Name": name.trim(),
      "Start Date": "",
      "Due Date": today,
      Priority: "P1",
      Type: "Task",
      Project: "",
      Notes: "",
      Links: "",
      "Complete Date": "",
      Size: "S",
    };
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setQuickTask(null);
    load();
    refreshKPIs();
  };

  const msByProject = useMemo(() => {
    const g: Record<string, Milestone[]> = {};
    milestones.forEach((m) => (g[m.project] ||= []).push(m));
    return g;
  }, [milestones]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const dueTasks = tasks;

  return (
    <div className="mc grid gap-2.5 md:grid-cols-3 w-full mc-stagger">
      {/* MILESTONES */}
      <Lane title="Milestones" count={milestones.length} addHref="/projects">
        {!loaded && <Skeleton />}
        {Object.entries(msByProject).map(([proj, items]) => (
          <div key={proj} className="py-1">
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [proj]: !c[proj] }))}
              className="w-full flex items-center gap-2 py-1 text-left"
            >
              <span className="mc-mono text-[10px] uppercase tracking-wider text-[#8a919c]">{proj}</span>
              <span className="mc-mono text-[10px] text-[#5b626d]">{items.length}</span>
              <span className="ml-auto mc-mono text-[10px] text-[#5b626d]">{collapsed[proj] ? "+" : "−"}</span>
            </button>
            {!collapsed[proj] &&
              items.map((m) => {
                const rd = relDue(m.due || null, today);
                return (
                  <div key={m.name} className={`mc-row${m.priority <= 2 ? ` p-${m.priority}` : ""}`}>
                    <span className="rail" />
                    <span className="rname">{m.name}</span>
                    <span className={`rmeta ${rd.cls}`}>{m.due ? rd.text : `P${m.priority}`}</span>
                  </div>
                );
              })}
          </div>
        ))}
        {loaded && milestones.length === 0 && <Empty>no open milestones</Empty>}
      </Lane>

      {/* TASKS */}
      <Lane title="Tasks · due ≤ wk" count={dueTasks.length} onAdd={() => setQuickTask("")}>
        {!loaded && <Skeleton />}
        {quickTask !== null && (
          <input
            autoFocus
            defaultValue=""
            placeholder="task name, enter to add"
            onKeyDown={(e) => {
              if (e.key === "Enter") addQuickTask((e.target as HTMLInputElement).value);
              if (e.key === "Escape") setQuickTask(null);
            }}
            className="w-full my-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1.5 text-[13px] text-[#e7eaee] outline-none focus:border-[#22d3ee] font-[inherit]"
          />
        )}
        {dueTasks.map((t) => {
          const rd = relDue(t["Due Date"], today);
          const gone = exiting.has(t._id);
          return (
            <div
              key={t._id}
              className={`mc-row ${pClass(t.Priority)} ${rd.cls === "late" ? "overdue" : ""} ${
                rd.cls === "today" ? "due-today" : ""
              } ${gone ? "mc-row-exit" : ""}`}
            >
              <span className="rail" />
              <div className="flex items-center gap-2 min-w-0">
                <button
                  className={`mc-check ${gone ? "on" : ""}`}
                  onClick={() => completeTask(t._id)}
                  aria-label="complete task"
                />
                <span className="rname truncate">{t["Task Name"]}</span>
              </div>
              <div className="flex items-center gap-2">
                {t.Size && <span className="mc-chip">{t.Size}</span>}
                <span className={`rmeta ${rd.cls}`}>{rd.text}</span>
              </div>
            </div>
          );
        })}
        {loaded && dueTasks.length === 0 && <Empty>nothing due this week</Empty>}
      </Lane>

      {/* LISTS */}
      <Lane title="Lists" count={lists.length} addHref="/backlog">
        {!loaded && <Skeleton />}
        {lists.map((l) => {
          const total = l.list.length;
          const done = l.list.filter((i) => i.done).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div key={l.name} className="mc-row" style={{ gridTemplateColumns: "1fr auto" }}>
              <div className="min-w-0">
                <div className="rname truncate">{l.name}</div>
                <div className="h-[3px] mt-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-[#22d3ee]/70" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="rmeta">
                {done}/{total}
              </span>
            </div>
          );
        })}
        {loaded && lists.length === 0 && <Empty>no lists</Empty>}
      </Lane>
    </div>
  );
}

const Skeleton = () => (
  <div className="space-y-1.5 py-2">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-7 rounded bg-white/[0.04] animate-pulse" />
    ))}
  </div>
);
const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mc-mono text-[11px] text-[#5b626d] py-4 text-center">{children}</div>
);
