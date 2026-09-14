"use client";

import React, { useEffect, useMemo, useState } from "react";
import { refreshKPIs } from "@/components/kpis/KPIDashboard";
import { getWeekBoundsEST, getTodayEST } from "@/utils/dateUtils";
import EditItemModal, { type EditItemFields } from "@/components/home/EditItemModal";
import EditListModal from "@/components/home/EditListModal";

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
  Notes?: string;
}
interface Milestone {
  name: string;
  project: string;
  projectId: string;
  priority: number;
  due: string;
  notes: string;
}
interface ListDoc {
  name: string;
  parent?: string | null;
  kind?: string; // "progress" -> show a completion bar; else rolling
  sortOrder?: number;
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
  accent: string;
  onAdd?: () => void;
  addHref?: string;
  children: React.ReactNode;
}> = ({ title, count, accent, onAdd, addHref, children }) => (
  <div
    className="mc-panel mc-kpi-card flex flex-col min-h-[220px] max-h-[440px]"
    style={{ "--kpi-accent": accent } as React.CSSProperties}
  >
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.08]">
      <span className="mc-lane-label">{title}</span>
      <span className="mc-mono text-[12px] font-bold text-[#e7eaee]">{count}</span>
      {addHref && (
        <a href={addHref} className="ml-auto mc-mono text-[#5b626d] hover:text-[#22d3ee] text-sm leading-none">
          +
        </a>
      )}
      {onAdd && !addHref && (
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

    // All open ToDos tasks, not just ones with a due date this week -- this
    // IS the ToDos pane on the homepage (mirrors /work's center pane), not a
    // due-soon filter, so a task with no due date (or one further out) still
    // needs to show up here. Unlike /work, this lane has no separate MISSED
    // tab, so overdue tasks stay in here too (relDue below just marks them
    // late in red) instead of silently disappearing.
    setTasks(
      (Array.isArray(b) ? b : [])
        .filter((t: Task) => !t["Complete Date"])
        .sort((a: Task, x: Task) => pRank(a.Priority) - pRank(x.Priority) || String(a["Due Date"] || "9999").localeCompare(String(x["Due Date"] || "9999")))
    );

    const ms: Milestone[] = [];
    // ToDos has its own tasks lane (the `b`/tasks fetch above) -- don't also
    // list its issues here as "milestones", or they show up twice.
    (Array.isArray(p) ? p : [])
      .filter((proj: any) => proj["Project Name"] !== "ToDos" && !proj.Hidden)
      .forEach((proj: any) => {
        Object.entries(proj.Milestones || {}).forEach(([name, m]: [string, any]) => {
          if (!m["Complete Date"]) {
            ms.push({
              name,
              project: proj["Project Name"],
              projectId: proj._id,
              priority: Number(m["Milestone Priority"]) || 3,
              due: m["Due Date"] || "",
              notes: m.Notes || "",
            });
          }
        });
      });
    ms.sort((a, b) => a.priority - b.priority || a.project.localeCompare(b.project));
    setMilestones(ms);

    // Lists without a sortOrder yet (nothing has ever been dragged) keep
    // their original DB order via index as the fallback sort key, so the
    // first-ever drag is the only thing that assigns real sortOrder values.
    const rawLists = (l?.lists || []).filter((x: ListDoc) => Array.isArray(x.list));
    const sortedLists = rawLists
      .map((x: ListDoc, i: number) => ({ x, key: x.sortOrder ?? i }))
      .sort((a: { key: number }, b: { key: number }) => a.key - b.key)
      .map(({ x }: { x: ListDoc }) => x);
    setLists(sortedLists);
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

  // --- click-to-edit modals ---
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const saveTask = async (t: Task, fields: EditItemFields) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: t._id,
        updatedItem: {
          "Task Name": fields.name,
          Priority: fields.priority,
          "Due Date": fields.dueDate || null,
          Notes: fields.notes,
          "Complete Date": fields.completed ? today : "",
        },
      }),
    });
    load();
    refreshKPIs();
  };

  const deleteTask = async (t: Task) => {
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t._id }),
    });
    load();
    refreshKPIs();
  };

  const saveMilestone = async (m: Milestone, fields: EditItemFields) => {
    await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: m.projectId,
        milestoneName: m.name,
        updates: {
          title: fields.name,
          "Milestone Priority": fields.priority.replace(/^P/, ""),
          "Due Date": fields.dueDate || null,
          Notes: fields.notes,
          "Complete Date": fields.completed ? today : "",
        },
      }),
    });
    load();
    refreshKPIs();
  };

  const deleteMilestone = async (m: Milestone) => {
    await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: m.projectId, milestoneName: m.name }),
    });
    load();
    refreshKPIs();
  };

  // --- lists ---
  const [openList, setOpenList] = useState<string | null>(null);

  const patchLocalItem = (listName: string, itemName: string, done: boolean) =>
    setLists((ls) =>
      ls.map((l) =>
        l.name === listName
          ? { ...l, list: l.list.map((i) => (i.name === itemName ? { ...i, done } : i)) }
          : l
      )
    );

  const toggleItem = async (listName: string, itemName: string, cur: boolean) => {
    patchLocalItem(listName, itemName, !cur);
    try {
      await fetch("/api/lists/items/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listName, itemName, updates: { done: !cur } }),
      });
    } catch {
      patchLocalItem(listName, itemName, cur); // revert
    }
  };

  const addItem = async (listName: string, name: string, el: HTMLInputElement) => {
    const v = name.trim();
    if (!v) return;
    el.value = "";
    setLists((ls) =>
      ls.map((l) => (l.name === listName ? { ...l, list: [...l.list, { name: v, done: false }] } : l))
    );
    try {
      await fetch("/api/lists/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listName, item: { name: v, done: false } }),
      });
    } catch {
      /* leave the optimistic row */
    }
  };

  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);

  const renameItem = async (listName: string, oldName: string, newNameRaw: string) => {
    const newName = newNameRaw.trim();
    setEditingItemKey(null);
    if (!newName || newName === oldName) return;
    setLists((ls) =>
      ls.map((l) =>
        l.name === listName
          ? { ...l, list: l.list.map((i) => (i.name === oldName ? { ...i, name: newName } : i)) }
          : l
      )
    );
    try {
      await fetch("/api/lists/items/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listName, itemName: oldName, updates: { name: newName } }),
      });
    } catch {
      load(); // reconcile on failure
    }
  };

  const deleteItem = async (listName: string, itemName: string) => {
    setLists((ls) =>
      ls.map((l) => (l.name === listName ? { ...l, list: l.list.filter((i) => i.name !== itemName) } : l))
    );
    try {
      await fetch("/api/lists/items/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listName, itemName }),
      });
    } catch {
      load(); // reconcile on failure
    }
  };

  // --- list edit/delete/reorder ---
  const [editingList, setEditingList] = useState<ListDoc | null>(null);

  const saveList = async (l: ListDoc, fields: { name: string; isProgress: boolean }) => {
    if (fields.name !== l.name) {
      await fetch("/api/lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", listName: l.name, newName: fields.name }),
      });
    }
    const wasProgress = l.kind === "progress";
    if (fields.isProgress !== wasProgress) {
      await fetch("/api/lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateKind",
          listName: fields.name, // renamed above already, if it changed
          kind: fields.isProgress ? "progress" : null,
        }),
      });
    }
    load();
  };

  const deleteList = async (l: ListDoc) => {
    setLists((ls) => ls.filter((x) => x.name !== l.name));
    try {
      await fetch("/api/lists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listName: l.name }),
      });
    } catch {
      load(); // reconcile on failure
    }
  };

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const persistListOrder = async (ordered: ListDoc[]) => {
    try {
      await fetch("/api/lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", order: ordered.map((x) => x.name) }),
      });
    } catch {
      /* local order stands even if the persist call fails; next load() reconciles */
    }
  };

  const handleListDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    setLists((ls) => {
      const next = [...ls];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      persistListOrder(next);
      return next;
    });
    setDragIndex(null);
  };

  const msByProject = useMemo(() => {
    const g: Record<string, Milestone[]> = {};
    milestones.forEach((m) => (g[m.project] ||= []).push(m));
    return g;
  }, [milestones]);
  // Undefined = default state. Projects start collapsed, so "expanded" (not
  // collapsed) is the explicit opt-in state here, rather than the reverse.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const dueTasks = tasks;

  return (
    <div className="mc grid gap-2.5 md:grid-cols-3 w-full mc-stagger">
      {/* TASKS */}
      <Lane title="ToDos" count={dueTasks.length} accent="#22d3ee" onAdd={() => setQuickTask("")}>
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
                <button
                  className="rname truncate text-left hover:text-[#22d3ee] bg-transparent border-0 p-0 font-[inherit] cursor-pointer min-w-0"
                  onClick={() => setEditingTask(t)}
                >
                  {t["Task Name"]}
                </button>
              </div>
              <div className="flex items-center gap-2">
                {t.Size && <span className="mc-chip">{t.Size}</span>}
                <span className={`rmeta ${rd.cls}`}>{rd.text}</span>
              </div>
            </div>
          );
        })}
        {loaded && dueTasks.length === 0 && <Empty>no open tasks</Empty>}
      </Lane>

      {/* MILESTONES */}
      <Lane title="Milestones" count={milestones.length} accent="#22d3ee" addHref="/projects">
        {!loaded && <Skeleton />}
        {Object.entries(msByProject).map(([proj, items]) => (
          <div key={proj} className="py-1">
            <button
              onClick={() => setExpanded((c) => ({ ...c, [proj]: !c[proj] }))}
              className="w-full flex items-center gap-2 py-1 text-left"
            >
              <span className="mc-mono text-[10px] uppercase tracking-wider text-[#8a919c]">{proj}</span>
              <span className="mc-mono text-[10px] text-[#5b626d]">{items.length}</span>
              <span className="ml-auto mc-mono text-[10px] text-[#5b626d]">{expanded[proj] ? "−" : "+"}</span>
            </button>
            {expanded[proj] &&
              items.map((m) => {
                const rd = relDue(m.due || null, today);
                return (
                  <div key={m.name} className={`mc-row${m.priority <= 2 ? ` p-${m.priority}` : ""}`}>
                    <span className="rail" />
                    <button
                      className="rname text-left hover:text-[#22d3ee] bg-transparent border-0 p-0 font-[inherit] cursor-pointer"
                      onClick={() => setEditingMilestone(m)}
                    >
                      {m.name}
                    </button>
                    <span className={`rmeta ${rd.cls}`}>{m.due ? rd.text : `P${m.priority}`}</span>
                  </div>
                );
              })}
          </div>
        ))}
        {loaded && milestones.length === 0 && <Empty>no open milestones</Empty>}
      </Lane>

      {/* LISTS */}
      <Lane title="Lists" count={lists.length} accent="#22d3ee">
        {!loaded && <Skeleton />}
        {lists.map((l, i) => {
          const total = l.list.length;
          const done = l.list.filter((it) => it.done).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const open = openList === l.name;
          const isProgress = l.kind === "progress";
          return (
            <div
              key={l.name}
              className={`border-b border-white/[0.06] last:border-b-0 ${dragIndex === i ? "opacity-40" : ""}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleListDrop(i)}
              onDragEnd={() => setDragIndex(null)}
            >
              <div className={`w-full flex items-center gap-2 pt-2.5 ${isProgress ? "" : "pb-2.5"}`}>
                <span className="mc-mono text-[12px] text-[#5b626d] cursor-grab select-none shrink-0" title="Drag to reorder">
                  ⠿
                </span>
                <button
                  onClick={() => setEditingList(l)}
                  className="shrink-0 max-w-[60%] text-left bg-transparent border-0 p-0 font-[inherit] cursor-pointer hover:text-[#22d3ee]"
                >
                  <span className="rname block truncate text-[12px]">{l.name}</span>
                </button>
                <button
                  onClick={() => setOpenList(open ? null : l.name)}
                  className="flex-1 h-full flex items-center gap-2 text-left bg-transparent border-0 p-0 cursor-pointer"
                  aria-label={open ? "Collapse list" : "Expand list"}
                >
                  <span className="mc-mono text-[10px] text-[#5b626d]">{open ? "−" : "+"}</span>
                </button>
              </div>
              {isProgress && (
                <div
                  className="block h-[3px] mt-1.5 mb-2.5 rounded-full bg-white/5 overflow-hidden"
                  title={`${done}/${total}`}
                >
                  <div className="block h-full rounded-full bg-[#22d3ee]/70" style={{ width: `${pct}%` }} />
                </div>
              )}
              {open && (
                <div className="pb-2 pl-[22px]">
                  {l.list.map((it) => {
                    const itemKey = `${l.name}::${it.name}`;
                    const isEditing = editingItemKey === itemKey;
                    return (
                      <div key={it.name} className="flex items-center gap-2 py-1 group">
                        <button
                          onClick={() => toggleItem(l.name, it.name, it.done)}
                          className="shrink-0 bg-transparent border-0 p-0 cursor-pointer"
                          aria-label="toggle done"
                        >
                          <span className={`mc-check ${it.done ? "on" : ""}`} />
                        </button>
                        {isEditing ? (
                          <input
                            autoFocus
                            defaultValue={it.name}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") renameItem(l.name, it.name, (e.target as HTMLInputElement).value);
                              if (e.key === "Escape") setEditingItemKey(null);
                            }}
                            onBlur={(e) => renameItem(l.name, it.name, e.target.value)}
                            className="flex-1 bg-white/[0.04] border border-white/10 rounded px-1.5 py-0.5 text-[12.5px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingItemKey(itemKey)}
                            className={`flex-1 min-w-0 text-left truncate bg-transparent border-0 p-0 font-[inherit] cursor-pointer text-[12.5px] hover:text-[#22d3ee] ${
                              it.done ? "line-through text-[#5b626d]" : "text-[#c4c9d0]"
                            }`}
                          >
                            {it.name}
                          </button>
                        )}
                        <button
                          onClick={() => deleteItem(l.name, it.name)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 text-[#5b626d] hover:text-[#f0426a] bg-transparent border-0 px-1 cursor-pointer transition-opacity"
                          aria-label="delete item"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <input
                    placeholder="add item, enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addItem(l.name, (e.target as HTMLInputElement).value, e.target as HTMLInputElement);
                    }}
                    className="w-full mt-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee]"
                  />
                </div>
              )}
            </div>
          );
        })}
        {loaded && lists.length === 0 && <Empty>no lists</Empty>}
      </Lane>

      {editingTask && (
        <EditItemModal
          title="Edit Task"
          initial={{
            name: editingTask["Task Name"],
            priority: editingTask.Priority || "P3",
            dueDate: editingTask["Due Date"] || "",
            notes: editingTask.Notes || "",
            completed: !!editingTask["Complete Date"],
          }}
          onSave={(fields) => saveTask(editingTask, fields)}
          onDelete={() => deleteTask(editingTask)}
          onClose={() => setEditingTask(null)}
        />
      )}

      {editingMilestone && (
        <EditItemModal
          title="Edit Milestone"
          initial={{
            name: editingMilestone.name,
            priority: `P${editingMilestone.priority}`,
            dueDate: editingMilestone.due || "",
            notes: editingMilestone.notes || "",
            completed: false,
          }}
          onSave={(fields) => saveMilestone(editingMilestone, fields)}
          onDelete={() => deleteMilestone(editingMilestone)}
          onClose={() => setEditingMilestone(null)}
        />
      )}

      {editingList && (
        <EditListModal
          initialName={editingList.name}
          initialIsProgress={editingList.kind === "progress"}
          onSave={(fields) => saveList(editingList, fields)}
          onDelete={() => deleteList(editingList)}
          onClose={() => setEditingList(null)}
        />
      )}
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
