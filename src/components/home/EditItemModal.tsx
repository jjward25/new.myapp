"use client";

import React, { useState } from "react";

const inputCls =
  "w-full bg-[#0c0d10] border border-white/20 rounded px-2 py-1.5 text-[13px] text-[#e7eaee] outline-none focus:border-[#22d3ee]";

export interface EditItemFields {
  name: string;
  priority: string; // "P0".."P3"
  dueDate: string; // "" or YYYY-MM-DD
  notes: string;
  completed: boolean;
}

// Shared edit modal for both Milestones and ToDos lanes -- opened by clicking
// a row's title in OpsBoard. Same field set (name/priority/due/notes/complete)
// for both, since both are Linear issues under the hood; only the save/delete
// callbacks differ per caller (milestone vs task endpoint).
const EditItemModal: React.FC<{
  title: string;
  initial: EditItemFields;
  onSave: (fields: EditItemFields) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}> = ({ title, initial, onSave, onDelete, onClose }) => {
  const [fields, setFields] = useState<EditItemFields>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof EditItemFields>(k: K, v: EditItemFields[K]) =>
    setFields((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await onSave(fields);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mc fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#131519] rounded-xl border border-white/[0.14] w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="mc-label">{title}</div>
          <button onClick={onClose} className="text-[#5b626d] hover:text-[#e7eaee]" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div>
            <label className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] block mb-1">Name</label>
            <input
              type="text"
              value={fields.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] block mb-1">Priority</label>
              <select value={fields.priority} onChange={(e) => set("priority", e.target.value)} className={inputCls}>
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
            </div>
            <div>
              <label className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] block mb-1">Due Date</label>
              <input
                type="date"
                value={fields.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] block mb-1">Notes</label>
            <textarea
              value={fields.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className={inputCls}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span
              className={`mc-check ${fields.completed ? "on" : ""}`}
              onClick={() => set("completed", !fields.completed)}
            />
            <span className="text-[13px] text-[#c4c9d0]">Mark complete</span>
          </label>
        </div>

        <div className="flex items-center gap-2 p-4 border-t border-white/[0.08]">
          <button
            onClick={doDelete}
            disabled={deleting}
            className={`mc-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded border ${
              confirmDelete
                ? "bg-[#f0426a]/20 border-[#f0426a] text-[#f0426a]"
                : "bg-white/[0.06] border-white/15 text-[#8a919c] hover:text-[#f0426a] hover:border-[#f0426a]"
            }`}
          >
            {deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete"}
          </button>
          <button
            onClick={onClose}
            className="ml-auto mc-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="mc-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded bg-[#35c48b]/15 border border-[#35c48b] text-[#35c48b] hover:bg-[#35c48b]/25"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;
