"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getTodayEST, getWeekBoundsEST } from "@/utils/dateUtils";
import { refreshKPIs } from "@/components/kpis/KPIDashboard";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  sortOrder?: number;
}
interface MilestoneRow {
  name: string;
  priority: number;
  due: string;
  done: boolean;
  sortOrder: number;
}
interface Project {
  _id: string;
  name: string;
  priority: number;
  sortOrder: number;
  hidden: boolean;
  milestones: MilestoneRow[];
}

/* ---------------- helpers ---------------- */
const pRank = (p: string) => ({ P0: 0, P1: 1, P2: 2, P3: 3 }[String(p).toUpperCase()] ?? 4);
const pClass = (p: string | number) => {
  const s = typeof p === "number" ? `P${p}` : String(p).toUpperCase();
  return s === "P0" ? "p-0" : s === "P1" ? "p-1" : s === "P2" ? "p-2" : "";
};

function relDue(due: string | null, today: string) {
  if (!due) return { text: "—", cls: "" };
  const days = Math.round((+new Date(due + "T00:00:00") - +new Date(today + "T00:00:00")) / 86_400_000);
  if (days < 0) return { text: `${-days}d late`, cls: "late" };
  if (days === 0) return { text: "today", cls: "today" };
  if (days === 1) return { text: "tomorrow", cls: "" };
  if (days <= 14) return { text: `in ${days}d`, cls: "" };
  return { text: due.slice(5), cls: "" };
}

// Fractional-index reorder: pick a sortOrder that lands the moved item
// between its new neighbors. Same scheme Linear itself uses for sortOrder,
// so it stays consistent with values Linear assigns to new items.
function midpointSortOrder<T extends { sortOrder?: number }>(reordered: T[], atIndex: number): number {
  const prev = reordered[atIndex - 1]?.sortOrder;
  const next = reordered[atIndex + 1]?.sortOrder;
  if (prev != null && next != null) return (prev + next) / 2;
  if (prev != null) return prev + 1;
  if (next != null) return next - 1;
  return 0;
}

const DragHandle = (props: { attributes: any; listeners: any }) => (
  <span
    {...props.attributes}
    {...props.listeners}
    className="mc-mono text-[10px] text-[#3a3f47] hover:text-[#8a919c] cursor-grab active:cursor-grabbing select-none px-0.5"
    aria-label="drag to reorder"
  >
    ⠿
  </span>
);

/* ---------------- board ---------------- */
type View = "open" | "done" | "missed";

export default function WorkBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("open");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  const today = getTodayEST();
  const week = useMemo(() => getWeekBoundsEST(new Date()), []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = async () => {
    const [p, t] = await Promise.all([
      fetch("/api/projects").then((r) => r.json()).catch(() => []),
      fetch("/api/tasks").then((r) => r.json()).catch(() => []),
    ]);
    // ToDos gets its own dedicated pane (center) -- don't also list it as a
    // project-with-milestones in the rail, or its tasks show up twice.
    const projs: Project[] = (Array.isArray(p) ? p : [])
      .filter((proj: any) => proj["Project Name"] !== "ToDos")
      .map((proj: any) => ({
        _id: String(proj._id),
        name: proj["Project Name"],
        priority: Number(proj["Project Priority"]) || 3,
        sortOrder: Number(proj.sortOrder) || 0,
        hidden: !!proj.Hidden,
        milestones: Object.entries(proj.Milestones || {})
          .map(([name, m]: [string, any]) => ({
            name,
            priority: Number(m["Milestone Priority"]) || 3,
            due: m["Due Date"] || "",
            done: !!m["Complete Date"],
            sortOrder: Number(m.sortOrder) || 0,
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
    projs.sort((a, b) => a.sortOrder - b.sortOrder);
    setProjects(projs);
    setTasks(
      (Array.isArray(t) ? t : []).slice().sort((a: Task, b: Task) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    );
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

  /* filtered tasks (always ToDos-scoped -- `tasks` already is) */
  const shown = useMemo(() => {
    const cutoff = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
    let list = tasks;
    if (view === "open") {
      list = list.filter((t) => !t["Complete Date"] && t.Missed !== true);
      return list; // manual sortOrder, drag-reorderable
    } else if (view === "done") {
      list = list.filter((t) => !!t["Complete Date"] && String(t["Complete Date"]) >= cutoff);
      return [...list].sort((a, b) =>
        String(b["Complete Date"] || "").localeCompare(String(a["Complete Date"] || ""))
      );
    } else {
      list = list.filter(
        (t) => t.Missed === true && !t["Complete Date"] && String(t["Due Date"] || "") >= cutoff
      );
      return [...list].sort((a, b) =>
        String(b["Due Date"] || "").localeCompare(String(a["Due Date"] || ""))
      );
    }
  }, [tasks, view]);

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
  const deleteProject = async (proj: Project) => {
    if (!confirm(`Delete "${proj.name}" and all its milestones? This cannot be undone.`)) return;
    setProjects((ps) => ps.filter((p) => p._id !== proj._id));
    try {
      await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: proj.name }),
      });
    } catch {
      load();
    }
  };

  const toggleHideProject = async (proj: Project) => {
    const hidden = !proj.hidden;
    setProjects((ps) => ps.map((p) => (p._id === proj._id ? { ...p, hidden } : p)));
    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: proj._id, updatedProject: { Hidden: hidden } }),
      });
    } catch {
      load();
    }
  };

  const deleteMilestone = async (proj: Project, ms: MilestoneRow) => {
    if (!confirm(`Delete milestone "${ms.name}"? This cannot be undone.`)) return;
    setProjects((ps) =>
      ps.map((p) =>
        p._id === proj._id ? { ...p, milestones: p.milestones.filter((m) => m.name !== ms.name) } : p
      )
    );
    try {
      await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: proj._id, milestoneName: ms.name }),
      });
    } catch {
      load();
    }
  };

  const editMilestone = async (proj: Project, ms: MilestoneRow, updates: { name?: string; due?: string; priority?: number }) => {
    const updatedMilestone: Record<string, any> = {};
    if (updates.name !== undefined && updates.name !== ms.name) updatedMilestone.title = updates.name;
    if (updates.due !== undefined) updatedMilestone["Due Date"] = updates.due;
    if (updates.priority !== undefined) updatedMilestone["Milestone Priority"] = String(updates.priority);
    if (Object.keys(updatedMilestone).length === 0) return;

    setProjects((ps) =>
      ps.map((p) =>
        p._id === proj._id
          ? {
              ...p,
              milestones: p.milestones.map((m) =>
                m.name === ms.name
                  ? { ...m, name: updates.name ?? m.name, due: updates.due ?? m.due, priority: updates.priority ?? m.priority }
                  : m
              ),
            }
          : p
      )
    );
    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: proj._id, milestoneName: ms.name, updatedMilestone }),
      });
    } catch {
      load();
    }
  };

  const addTask = async (name: string, el: HTMLInputElement) => {
    const v = name.trim();
    if (!v) return;
    el.value = "";
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "Task Name": v, "Due Date": today, Priority: "P1" }),
    });
    load();
    refreshKPIs();
  };

  const deleteTask = async (task: Task) => {
    if (!confirm(`Delete "${task["Task Name"]}"? This cannot be undone.`)) return;
    setTasks((ts) => ts.filter((t) => t._id !== task._id));
    try {
      await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task._id }),
      });
      refreshKPIs();
    } catch {
      load();
    }
  };

  const editTask = async (task: Task, updates: { name?: string; due?: string; priority?: string }) => {
    const updatedItem: Record<string, any> = {};
    if (updates.name !== undefined && updates.name !== task["Task Name"]) updatedItem["Task Name"] = updates.name;
    if (updates.due !== undefined) updatedItem["Due Date"] = updates.due;
    if (updates.priority !== undefined) updatedItem.Priority = updates.priority;
    if (Object.keys(updatedItem).length === 0) return;

    setTasks((ts) =>
      ts.map((t) =>
        t._id === task._id
          ? { ...t, "Task Name": updates.name ?? t["Task Name"], "Due Date": updates.due ?? t["Due Date"], Priority: updates.priority ?? t.Priority }
          : t
      )
    );
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task._id, updatedItem }),
      });
    } catch {
      load();
    }
  };

  /* drag handlers */
  const onProjectDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = projects.findIndex((p) => p._id === active.id);
    const newIndex = projects.findIndex((p) => p._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(projects, oldIndex, newIndex);
    const newSortOrder = midpointSortOrder(reordered, newIndex);
    setProjects(reordered.map((p) => (p._id === active.id ? { ...p, sortOrder: newSortOrder } : p)));
    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: active.id, updatedProject: { sortOrder: newSortOrder } }),
      });
    } catch {
      load();
    }
  };

  // `visible` is whatever's actually rendered (respects the show/hide-completed
  // toggle) -- reorder math runs against that so drag indices match what's on
  // screen, but the sortOrder result gets applied to the FULL milestone list
  // by name, never by replacing the array, so hidden completed milestones are
  // never silently dropped from state.
  const onMilestoneDragEnd = async (proj: Project, visible: MilestoneRow[], e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = visible.findIndex((m) => m.name === active.id);
    const newIndex = visible.findIndex((m) => m.name === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(visible, oldIndex, newIndex);
    const newSortOrder = midpointSortOrder(reordered, newIndex);
    const milestoneName = String(active.id);
    setProjects((ps) =>
      ps.map((p) =>
        p._id === proj._id
          ? { ...p, milestones: p.milestones.map((m) => (m.name === milestoneName ? { ...m, sortOrder: newSortOrder } : m)) }
          : p
      )
    );
    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: proj._id,
          milestoneName,
          updatedMilestone: { sortOrder: newSortOrder },
        }),
      });
    } catch {
      load();
    }
  };

  const onTaskDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = shown.findIndex((t) => t._id === active.id);
    const newIndex = shown.findIndex((t) => t._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(shown, oldIndex, newIndex);
    const newSortOrder = midpointSortOrder(reordered, newIndex);
    setTasks((ts) => {
      const others = ts.filter((t) => !shown.includes(t));
      return [...others, ...reordered.map((t) => (t._id === active.id ? { ...t, sortOrder: newSortOrder } : t))];
    });
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: active.id, updatedItem: { sortOrder: newSortOrder } }),
      });
    } catch {
      load();
    }
  };

  return (
    <div className="mc w-full max-w-[1200px] mx-auto px-3 md:px-6 py-6 flex flex-col gap-5">
      {/* masthead */}
      <div>
        <h1 className="mc-mono text-lg tracking-[0.2em] text-[#e7eaee]">PROJECT MANAGEMENT</h1>
        <div className="mc-mono text-[11px] text-[#8a919c] mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>{stats.open} open</span>
          <span className={stats.overdue ? "text-[#f0426a]" : ""}>{stats.overdue} overdue</span>
          <span>{stats.msLive} milestones live</span>
          <span className="text-[#35c48b]">{stats.doneWk} done this wk</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 items-start">
        {/* ---- projects rail ---- */}
        <div className="mc-panel flex flex-col max-h-[70vh]">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.08]">
            <span className="mc-label">Projects & Milestones</span>
            <span className="mc-mono text-[11px] text-[#5b626d]">{projects.length}</span>
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className={`ml-auto mc-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                showCompleted ? "bg-[#22d3ee] text-[#0c0d10]" : "bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]"
              }`}
            >
              {showCompleted ? "Hide completed" : "Show completed"}
            </button>
            <button
              onClick={() => setNewProj((v) => !v)}
              className="mc-mono text-[#5b626d] hover:text-[#22d3ee] text-sm leading-none"
            >
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-1">
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

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onProjectDragEnd}>
              <SortableContext items={projects.map((p) => p._id)} strategy={verticalListSortingStrategy}>
                {projects.map((p) => {
                  const total = p.milestones.length;
                  const done = p.milestones.filter((m) => m.done).length;
                  const isOpen = expanded[p._id];
                  return (
                    <SortableProjectRow
                      key={p._id}
                      project={p}
                      total={total}
                      done={done}
                      isOpen={isOpen}
                      onToggleExpand={() => setExpanded((e) => ({ ...e, [p._id]: !e[p._id] }))}
                      onToggleHide={() => toggleHideProject(p)}
                      onDelete={() => deleteProject(p)}
                    >
                      {isOpen && (
                        <div className="pl-3 pb-2">
                          {(() => {
                            const visible = showCompleted ? p.milestones : p.milestones.filter((m) => !m.done);
                            const hiddenCount = p.milestones.length - visible.length;
                            return (
                              <>
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={(e) => onMilestoneDragEnd(p, visible, e)}
                                >
                                  <SortableContext items={visible.map((m) => m.name)} strategy={verticalListSortingStrategy}>
                                    {visible.map((m) => (
                                      <SortableMilestoneRow
                                        key={m.name}
                                        milestone={m}
                                        today={today}
                                        onToggle={() => toggleMilestone(p, m)}
                                        onDelete={() => deleteMilestone(p, m)}
                                        onEdit={(updates) => editMilestone(p, m, updates)}
                                      />
                                    ))}
                                  </SortableContext>
                                </DndContext>
                                {!showCompleted && hiddenCount > 0 && (
                                  <p className="mc-mono text-[10px] text-[#5b626d] py-1 pl-6">
                                    {hiddenCount} completed hidden
                                  </p>
                                )}
                              </>
                            );
                          })()}
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
                    </SortableProjectRow>
                  );
                })}
              </SortableContext>
            </DndContext>
            {loaded && projects.length === 0 && <Empty>no projects</Empty>}
          </div>
        </div>

        {/* ---- ToDos tasks pane ---- */}
        <div className="mc-panel flex flex-col max-h-[70vh]">
          <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.08] flex-wrap">
            <span className="mc-label">ToDos</span>
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
            {view === "open" ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onTaskDragEnd}>
                <SortableContext items={shown.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                  {shown.map((t) => (
                    <SortableTaskRow
                      key={t._id}
                      task={t}
                      today={today}
                      gone={exiting.has(t._id)}
                      onComplete={() => completeTask(t._id)}
                      onDelete={() => deleteTask(t)}
                      onEdit={(updates) => editTask(t, updates)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              shown.map((t) => {
                const rd = relDue(t["Due Date"], today);
                return (
                  <div key={t._id} className={`mc-row ${pClass(t.Priority)}`}>
                    <span className="rail" />
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`rname truncate ${view === "done" ? "text-[#5b626d]" : ""}`}>{t["Task Name"]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.Size && <span className="mc-chip">{t.Size}</span>}
                      <span className={`rmeta ${rd.cls}`}>{view === "done" ? t["Complete Date"]?.slice(5) : rd.text}</span>
                    </div>
                  </div>
                );
              })
            )}
            {loaded && shown.length === 0 && <Empty>nothing here</Empty>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- sortable rows ---------------- */

function SortableProjectRow({
  project: p,
  total,
  done,
  isOpen,
  onToggleExpand,
  onToggleHide,
  onDelete,
  children,
}: {
  project: Project;
  total: number;
  done: number;
  isOpen: boolean;
  onToggleExpand: () => void;
  onToggleHide: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="border-b border-white/[0.05] last:border-b-0 group">
      <div className={`mc-row ${pClass(p.priority)}`} style={{ gridTemplateColumns: "14px 3px 1fr auto auto auto auto" }}>
        <DragHandle attributes={attributes} listeners={listeners} />
        <span className="rail" />
        <button onClick={onToggleExpand} className="text-left min-w-0">
          <span className={`rname block truncate ${p.hidden ? "text-[#5b626d]" : ""}`}>
            {p.hidden && "🗄️ "}
            {p.name}
          </span>
        </button>
        <span className="rmeta">{total ? `${done}/${total}` : ""}</span>
        <button
          onClick={onToggleHide}
          title={p.hidden ? "Unhide from homepage" : "Hide from homepage"}
          className="opacity-0 group-hover:opacity-100 mc-mono text-[11px] text-[#5b626d] hover:text-[#22d3ee] w-4"
        >
          {p.hidden ? "👁️" : "🗄️"}
        </button>
        <button
          onClick={onDelete}
          title="Delete project"
          className="opacity-0 group-hover:opacity-100 mc-mono text-[11px] text-[#5b626d] hover:text-[#f0426a] w-4"
        >
          ✕
        </button>
        <button onClick={onToggleExpand} className="mc-mono text-[10px] text-[#5b626d] w-4">
          {total ? (isOpen ? "−" : "+") : ""}
        </button>
      </div>
      {children}
    </div>
  );
}

function SortableMilestoneRow({
  milestone: m,
  today,
  onToggle,
  onDelete,
  onEdit,
}: {
  milestone: MilestoneRow;
  today: string;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (updates: { name?: string; due?: string; priority?: number }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.name });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const rd = relDue(m.due || null, today);
  const [editing, setEditing] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div style={{ gridTemplateColumns: "14px 3px auto 1fr auto auto auto" }} className={`mc-row ${pClass(m.priority)}`}>
        <DragHandle attributes={attributes} listeners={listeners} />
        <span className="rail" />
        <button className={`mc-check ${m.done ? "on" : ""}`} onClick={onToggle} aria-label="toggle milestone" />
        <span className={`rname truncate ${m.done ? "line-through text-[#5b626d]" : ""}`}>{m.name}</span>
        <span className={`rmeta ${rd.cls}`}>{m.due ? rd.text : `P${m.priority}`}</span>
        <button
          onClick={() => setEditing((v) => !v)}
          title="Edit milestone"
          className="opacity-0 group-hover:opacity-100 mc-mono text-[11px] text-[#5b626d] hover:text-[#22d3ee] w-4"
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          title="Delete milestone"
          className="opacity-0 group-hover:opacity-100 mc-mono text-[11px] text-[#5b626d] hover:text-[#f0426a] w-4"
        >
          ✕
        </button>
      </div>
      {editing && (
        <div className="flex flex-wrap gap-1.5 pl-6 pb-1.5">
          <input
            defaultValue={m.name}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEdit({ name: (e.target as HTMLInputElement).value });
                setEditing(false);
              }
              if (e.key === "Escape") setEditing(false);
            }}
            className="flex-1 min-w-[140px] bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
          />
          <input
            type="date"
            defaultValue={m.due || ""}
            onChange={(e) => onEdit({ due: e.target.value })}
            className="bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
          />
          <select
            defaultValue={m.priority}
            onChange={(e) => onEdit({ priority: Number(e.target.value) })}
            className="bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>P{n}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function SortableTaskRow({
  task: t,
  today,
  gone,
  onComplete,
  onDelete,
  onEdit,
}: {
  task: Task;
  today: string;
  gone: boolean;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: (updates: { name?: string; due?: string; priority?: string }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const rd = relDue(t["Due Date"], today);
  const [editing, setEditing] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        style={{ gridTemplateColumns: "14px 3px 1fr auto auto auto" }}
        className={`mc-row ${pClass(t.Priority)} ${rd.cls === "late" ? "overdue" : ""} ${gone ? "mc-row-exit" : ""}`}
      >
        <DragHandle attributes={attributes} listeners={listeners} />
        <span className="rail" />
        <div className="flex items-center gap-2 min-w-0">
          <button className={`mc-check ${gone ? "on" : ""}`} onClick={onComplete} aria-label="complete task" />
          <span className="rname truncate">{t["Task Name"]}</span>
        </div>
        <div className="flex items-center gap-2">
          {t.Size && <span className="mc-chip">{t.Size}</span>}
          <span className={`rmeta ${rd.cls}`}>{rd.text}</span>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          title="Edit task"
          className="opacity-0 group-hover:opacity-100 mc-mono text-[11px] text-[#5b626d] hover:text-[#22d3ee] w-4"
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          title="Delete task"
          className="opacity-0 group-hover:opacity-100 mc-mono text-[11px] text-[#5b626d] hover:text-[#f0426a] w-4"
        >
          ✕
        </button>
      </div>
      {editing && (
        <div className="flex flex-wrap gap-1.5 pl-6 pb-1.5">
          <input
            defaultValue={t["Task Name"]}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEdit({ name: (e.target as HTMLInputElement).value });
                setEditing(false);
              }
              if (e.key === "Escape") setEditing(false);
            }}
            className="flex-1 min-w-[140px] bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
          />
          <input
            type="date"
            defaultValue={t["Due Date"] || ""}
            onChange={(e) => onEdit({ due: e.target.value })}
            className="bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
          />
          <select
            defaultValue={t.Priority}
            onChange={(e) => onEdit({ priority: e.target.value })}
            className="bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
          >
            {["P0", "P1", "P2", "P3"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}
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
