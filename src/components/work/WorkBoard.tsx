"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getTodayEST, getWeekBoundsEST } from "@/utils/dateUtils";
import { refreshKPIs } from "@/components/kpis/KPIDashboard";

/* ---------------- types ---------------- */
interface Task {
  _id: string;
  "Task Name": string;
  "Due Date": string | null;
  "Complete Date": string | null;
  Priority: string;
  Size: string;
  Type: string;
  Missed?: boolean;
  Project?: string;
  Milestone?: string | null;
}
interface MilestoneRow {
  name: string;
  priority: number;
  due: string;
  done: boolean;
}
interface Project {
  _id: string;
  name: string;
  priority: number;
  milestones: MilestoneRow[];
}

/* ---------------- helpers ---------------- */
const pRank = (p: string) => ({ P0: 0, P1: 1, P2: 2, P3: 3 }[String(p).toUpperCase()] ?? 4);
const pClass = (p: string | number) => {
  const s = typeof p === "number" ? `P${p}` : String(p).toUpperCase();
  return s === "P0" ? "p-0" : s === "P1" ? "p-1" : s === "P2" ? "p-2" : "";
};
const NO_PROJECT = "__none__";

function relDue(due: string | null, today: string) {
  if (!due) return { text: "—", cls: "" };
  const days = Math.round((+new Date(due + "T00:00:00") - +new Date(today + "T00:00:00")) / 86_400_000);
  if (days < 0) return { text: `${-days}d late`, cls: "late" };
  if (days === 0) return { text: "today", cls: "today" };
  if (days === 1) return { text: "tomorrow", cls: "" };
  if (days <= 14) return { text: `in ${days}d`, cls: "" };
  return { text: due.slice(5), cls: "" };
}

/* ---------------- board ---------------- */
type View = "open" | "done" | "missed";

export default function WorkBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [scope, setScope] = useState<string | null>(null); // null = all
  const [view, setView] = useState<View>("open");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  const today = getTodayEST();
  const week = useMemo(() => getWeekBoundsEST(new Date()), []);

  const load = async () => {
    const [p, t] = await Promise.all([
      fetch("/api/projects").then((r) => r.json()).catch(() => []),
      fetch("/api/tasks").then((r) => r.json()).catch(() => []),
    ]);
    const projs: Project[] = (Array.isArray(p) ? p : []).map((proj: any) => ({
      _id: String(proj._id),
      name: proj["Project Name"],
      priority: Number(proj["Project Priority"]) || 3,
      milestones: Object.entries(proj.Milestones || {})
        .map(([name, m]: [string, any]) => ({
          name,
          priority: Number(m["Milestone Priority"]) || 3,
          due: m["Due Date"] || "",
          done: !!m["Complete Date"],
        }))
        .sort((a, b) => Number(a.done) - Number(b.done) || a.priority - b.priority),
    }));
    projs.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
    setProjects(projs);
    setTasks(Array.isArray(t) ? t : []);
    setLoaded(true);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* stats */
  const stats = useMemo(() => {
    const open = tasks.filter((t) => !t["Complete Date"] && t.Missed !== true);
    const overdue = open.filter((t) => t["Due Date"] && t["Due Date"] < today).length;
    const doneWk = tasks.filter(
      (t) => t["Complete Date"] && t["Complete Date"] >= week.start && t["Complete Date"] <= week.end
    ).length;
    const msLive = projects.reduce((n, p) => n + p.milestones.filter((m) => !m.done).length, 0);
    return { open: open.length, overdue, doneWk, msLive };
  }, [tasks, projects, today, week]);

  /* filtered tasks */
  const shown = useMemo(() => {
    // done/missed histories are large — cap them to the trailing ~45 days so
    // the panel stays a working view, not an archive dump.
    const cutoff = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
    let list = tasks;
    if (view === "open") {
      list = list.filter((t) => !t["Complete Date"] && t.Missed !== true);
    } else if (view === "done") {
      list = list.filter((t) => !!t["Complete Date"] && String(t["Complete Date"]) >= cutoff);
    } else {
      list = list.filter(
        (t) => t.Missed === true && !t["Complete Date"] && String(t["Due Date"] || "") >= cutoff
      );
    }

    if (scope === NO_PROJECT) list = list.filter((t) => !t.Project);
    else if (scope) list = list.filter((t) => t.Project === scope);

    if (view === "done")
      return [...list].sort((a, b) =>
        String(b["Complete Date"] || "").localeCompare(String(a["Complete Date"] || ""))
      );
    if (view === "missed")
      return [...list].sort((a, b) =>
        String(b["Due Date"] || "").localeCompare(String(a["Due Date"] || ""))
      );
    return [...list].sort(
      (a, b) =>
        pRank(a.Priority) - pRank(b.Priority) ||
        String(a["Due Date"] || "9999").localeCompare(String(b["Due Date"] || "9999"))
    );
  }, [tasks, view, scope]);

  /* actions */
  const completeTask = async (id: string) => {
    setExiting((s) => new Set(s).add(id));
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updatedItem: { "Complete Date": today } }),
      });
      setTimeout(() => {
        setTasks((ts) => ts.map((t) => (t._id === id ? { ...t, "Complete Date": today } : t)));
        setExiting((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
        refreshKPIs();
      }, 260);
    } catch {
      setExiting((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const toggleMilestone = async (proj: Project, ms: MilestoneRow) => {
    const done = !ms.done;
    setProjects((ps) =>
      ps.map((p) =>
        p._id === proj._id
          ? { ...p, milestones: p.milestones.map((m) => (m.name === ms.name ? { ...m, done } : m)) }
          : p
      )
    );
    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: proj._id,
          milestoneName: ms.name,
          updatedMilestone: { "Complete Date": done ? today : "" },
        }),
      });
      refreshKPIs();
    } catch {
      load();
    }
  };

  const [newProj, setNewProj] = useState(false);
  const addProject = async (name: string, el: HTMLInputElement) => {
    const v = name.trim();
    if (!v) return;
    el.value = "";
    setNewProj(false);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName: v, projectPriority: "2" }),
    });
    load();
  };
  const addMilestone = async (projectName: string, msName: string, el: HTMLInputElement) => {
    const v = msName.trim();
    if (!v) return;
    el.value = "";
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectName,
        msName: v,
        milestone: { "Milestone Priority": "2", "Due Date": "", "Complete Date": "", Notes: "" },
      }),
    });
    load();
  };
  const addTask = async (name: string, el: HTMLInputElement) => {
    const v = name.trim();
    if (!v) return;
    el.value = "";
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "Task Name": v,
        "Due Date": today,
        Priority: "P1",
        Type: "Task",
        Project: scope && scope !== NO_PROJECT ? scope : "",
        Size: "S",
        "Complete Date": "",
      }),
    });
    load();
    refreshKPIs();
  };

  const scopeLabel = scope === NO_PROJECT ? "No project" : scope || "All tasks";

  return (
    <div className="mc w-full max-w-[1200px] mx-auto px-3 md:px-6 py-6 flex flex-col gap-5">
      {/* masthead */}
      <div>
        <h1 className="mc-mono text-lg tracking-[0.2em] text-[#e7eaee]">WORK</h1>
        <div className="mc-mono text-[11px] text-[#8a919c] mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>{stats.open} open</span>
          <span className={stats.overdue ? "text-[#f0426a]" : ""}>{stats.overdue} overdue</span>
          <span>{stats.msLive} milestones live</span>
          <span className="text-[#35c48b]">{stats.doneWk} done this wk</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(260px,340px)_1fr] items-start">
        {/* ---- projects rail ---- */}
        <div className="mc-panel flex flex-col max-h-[70vh]">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.08]">
            <span className="mc-label">Projects & Milestones</span>
            <span className="mc-mono text-[11px] text-[#5b626d]">{projects.length}</span>
            <button
              onClick={() => setNewProj((v) => !v)}
              className="ml-auto mc-mono text-[#5b626d] hover:text-[#22d3ee] text-sm leading-none"
            >
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-1">
            <button
              onClick={() => setScope(null)}
              className={`w-full text-left px-2 py-1.5 mc-mono text-[11px] rounded ${
                scope === null ? "text-[#22d3ee]" : "text-[#8a919c] hover:text-[#e7eaee]"
              }`}
            >
              ALL TASKS
            </button>
            <button
              onClick={() => setScope(NO_PROJECT)}
              className={`w-full text-left px-2 py-1.5 mc-mono text-[11px] rounded ${
                scope === NO_PROJECT ? "text-[#22d3ee]" : "text-[#8a919c] hover:text-[#e7eaee]"
              }`}
            >
              NO PROJECT
            </button>

            {newProj && (
              <input
                autoFocus
                placeholder="project name, enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addProject((e.target as HTMLInputElement).value, e.target as HTMLInputElement);
                  if (e.key === "Escape") setNewProj(false);
                }}
                className="w-full my-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1.5 text-[13px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
              />
            )}

            {!loaded && <Skeleton />}
            {projects.map((p) => {
              const total = p.milestones.length;
              const done = p.milestones.filter((m) => m.done).length;
              const isOpen = expanded[p._id];
              const active = scope === p.name;
              return (
                <div key={p._id} className="border-b border-white/[0.05] last:border-b-0">
                  <div className={`mc-row ${pClass(p.priority)}`} style={{ gridTemplateColumns: "3px 1fr auto auto" }}>
                    <span className="rail" />
                    <button onClick={() => setScope(p.name)} className="text-left min-w-0">
                      <span className={`rname block truncate ${active ? "text-[#22d3ee]" : ""}`}>{p.name}</span>
                    </button>
                    <span className="rmeta">{total ? `${done}/${total}` : ""}</span>
                    <button
                      onClick={() => setExpanded((e) => ({ ...e, [p._id]: !e[p._id] }))}
                      className="mc-mono text-[10px] text-[#5b626d] w-4"
                    >
                      {total ? (isOpen ? "−" : "+") : ""}
                    </button>
                  </div>
                  {isOpen && (
                    <div className="pl-3 pb-2">
                      {p.milestones.map((m) => {
                        const rd = relDue(m.due || null, today);
                        return (
                          <div key={m.name} className={`mc-row ${pClass(m.priority)}`} style={{ gridTemplateColumns: "3px auto 1fr auto" }}>
                            <span className="rail" />
                            <button
                              className={`mc-check ${m.done ? "on" : ""}`}
                              onClick={() => toggleMilestone(p, m)}
                              aria-label="toggle milestone"
                            />
                            <span className={`rname truncate ${m.done ? "line-through text-[#5b626d]" : ""}`}>{m.name}</span>
                            <span className={`rmeta ${rd.cls}`}>{m.due ? rd.text : `P${m.priority}`}</span>
                          </div>
                        );
                      })}
                      <input
                        placeholder="add milestone, enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            addMilestone(p.name, (e.target as HTMLInputElement).value, e.target as HTMLInputElement);
                        }}
                        className="w-full mt-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {loaded && projects.length === 0 && <Empty>no projects</Empty>}
          </div>
        </div>

        {/* ---- tasks ---- */}
        <div className="mc-panel flex flex-col max-h-[70vh]">
          <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.08] flex-wrap">
            <div className="flex gap-1">
              {(["open", "done", "missed"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`mc-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                    view === v ? "bg-[#22d3ee] text-[#0c0d10]" : "text-[#8a919c] hover:text-[#e7eaee]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <span className="mc-mono text-[10px] text-[#5b626d] border border-white/10 rounded px-2 py-0.5">
              {scopeLabel}
            </span>
            <span className="mc-mono text-[11px] text-[#5b626d]">{shown.length}</span>
            <input
              placeholder="+ task, enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask((e.target as HTMLInputElement).value, e.target as HTMLInputElement);
              }}
              className="ml-auto w-40 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-1">
            {!loaded && <Skeleton />}
            {shown.map((t) => {
              const rd = relDue(t["Due Date"], today);
              const gone = exiting.has(t._id);
              return (
                <div
                  key={t._id}
                  className={`mc-row ${pClass(t.Priority)} ${rd.cls === "late" && view === "open" ? "overdue" : ""} ${
                    gone ? "mc-row-exit" : ""
                  }`}
                >
                  <span className="rail" />
                  <div className="flex items-center gap-2 min-w-0">
                    {view === "open" && (
                      <button
                        className={`mc-check ${gone ? "on" : ""}`}
                        onClick={() => completeTask(t._id)}
                        aria-label="complete task"
                      />
                    )}
                    <span className={`rname truncate ${view === "done" ? "text-[#5b626d]" : ""}`}>
                      {t["Task Name"]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.Project && <span className="mc-chip">{t.Project}</span>}
                    {t.Size && <span className="mc-chip">{t.Size}</span>}
                    <span className={`rmeta ${rd.cls}`}>{view === "done" ? t["Complete Date"]?.slice(5) : rd.text}</span>
                  </div>
                </div>
              );
            })}
            {loaded && shown.length === 0 && <Empty>nothing here</Empty>}
          </div>
        </div>
      </div>
    </div>
  );
}

const Skeleton = () => (
  <div className="space-y-1.5 py-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-7 rounded bg-white/[0.04] animate-pulse" />
    ))}
  </div>
);
const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mc-mono text-[11px] text-[#5b626d] py-6 text-center">{children}</div>
);
