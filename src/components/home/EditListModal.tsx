"use client";

import React, { useState } from "react";

const inputCls =
  "w-full bg-[#0c0d10] border border-white/20 rounded px-2 py-1.5 text-[13px] text-[#e7eaee] outline-none focus:border-[#22d3ee]";

// Small edit modal for a List doc -- rename, toggle the "progress bar"
// display kind, or delete. Distinct from EditItemModal (Milestones/ToDos)
// since Lists don't have priority/due-date/notes/complete fields.
const EditListModal: React.FC<{
  initialName: string;
  initialIsProgress: boolean;
  onSave: (fields: { name: string; isProgress: boolean }) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}> = ({ initialName, initialIsProgress, onSave, onDelete, onClose }) => {
  const [name, setName] = useState(initialName);
  const [isProgress, setIsProgress] = useState(initialIsProgress);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ name: name.trim(), isProgress });
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
          <div className="mc-label">Edit List</div>
          <button onClick={onClose} className="text-[#5b626d] hover:text-[#e7eaee]" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div>
            <label className="mc-mono text-[10px] uppercase tracking-widest text-[#8a919c] block mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoFocus />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className={`mc-check ${isProgress ? "on" : ""}`} onClick={() => setIsProgress((v) => !v)} />
            <span className="text-[13px] text-[#c4c9d0]">Show progress bar (done / total)</span>
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
            disabled={saving || !name.trim()}
            className="mc-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded bg-[#35c48b]/15 border border-[#35c48b] text-[#35c48b] hover:bg-[#35c48b]/25"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditListModal;
