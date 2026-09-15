"use client";

import React, { useState } from "react";
import { inputCls } from "./ExerciseLogRow";

const NEW_VALUE = "__new__";

// Small inline picker shared by "Swap" (replace a prescribed exercise for
// today only) and "+ Add exercise" (append a freeform row) -- deliberately
// not a modal, so it stays consistent with the accordion's inline feel.
export default function ExercisePicker({
  options,
  onPick,
  onCancel,
  placeholder,
  allowNew = true,
}: {
  options: string[];
  onPick: (name: string) => void;
  onCancel: () => void;
  placeholder?: string;
  // false for pickers over a fixed, real list (e.g. "start a workout") where
  // typing something new wouldn't correspond to anything real.
  allowNew?: boolean;
}) {
  const [selected, setSelected] = useState("");
  const [newName, setNewName] = useState("");
  const isNew = allowNew && selected === NEW_VALUE;

  const confirm = () => {
    const name = (isNew ? newName : selected).trim();
    if (!name) return;
    onPick(name);
  };

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded border border-white/10 bg-[#0c0d10]">
      {!isNew ? (
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className={inputCls}>
          <option value="">{placeholder || "Choose an exercise…"}</option>
          {options.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
          {allowNew && <option value={NEW_VALUE}>+ New exercise…</option>}
        </select>
      ) : (
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Exercise name"
          className={inputCls}
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={confirm}
          disabled={isNew ? !newName.trim() : !selected}
          className="flex-1 mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-[#22d3ee]/20 border border-[#22d3ee] text-[#22d3ee] hover:bg-[#22d3ee]/30 disabled:opacity-40"
        >
          {isNew ? "Add" : "Confirm"}
        </button>
        <button
          onClick={onCancel}
          className="mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-white/[0.06] border border-white/15 text-[#8a919c] hover:text-[#e7eaee]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
