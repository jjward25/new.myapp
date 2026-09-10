"use client";
import React, { useState } from 'react';
import axios from 'axios';

// Recessed/dark relative to the card (#171a1f) so fields read as distinct
// wells, not a shade of the same background -- the previous bg-white/[0.04]
// was nearly the same color as the card itself.
const inputCls =
  "w-full bg-[#0c0d10] border border-white/20 rounded px-2 py-1.5 text-[13px] text-[#e7eaee] outline-none focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee]";
// Solid fill + bright border so buttons read as buttons, not dim text.
const btnCls =
  "mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-white/[0.08] border border-white/25 text-[#e7eaee] hover:bg-[#22d3ee]/15 hover:border-[#22d3ee] hover:text-[#22d3ee] transition-colors";
const btnPrimaryCls =
  "mc-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-[#22d3ee]/20 border border-[#22d3ee] text-[#22d3ee] hover:bg-[#22d3ee]/30 transition-colors";

const RoutineCard = ({ routine, isEditing, onInputChange, onEditToggle, onSave, onDelete, weeklyCounts = {}, weeklyTargets = {}, remainingDays = 7 }) => {
  const [newReadLearnText, setNewReadLearnText] = useState('');
  const [newReadLearnLink, setNewReadLearnLink] = useState('');

  // Check if Pass button should be shown for a routine
  // Pass is only available if: target < 7 AND remainingDays > (target - currentCount)
  const canPass = (key) => {
    const target = weeklyTargets[key] || 7;
    const current = weeklyCounts[key] || 0;
    const remaining = target - current;
    // Can only pass if there are more days remaining than needed to complete the goal
    return target < 7 && remainingDays > remaining;
  };

  // Handle setting a routine to "Pass"
  const handlePass = (key) => {
    onInputChange({ target: { value: 'Pass', type: 'pass' } }, key);
  };

  const handleDelete = async () => {
    try {
      await axios.delete('/api/routines', { data: { id: routine._id } });
      onDelete(routine._id);
    } catch (err) {
      console.error('Error deleting routine:', err);
    }
  };

  const handleAddReadLearn = () => {
    if (!newReadLearnText.trim()) return;

    const currentItems = routine.ReadLearn || [];
    const newItem = {
      text: newReadLearnText.trim(),
      link: newReadLearnLink.trim() || null,
    };

    onInputChange({ target: { value: [...currentItems, newItem] } }, 'ReadLearn');
    setNewReadLearnText('');
    setNewReadLearnLink('');
  };

  const handleRemoveReadLearn = (index) => {
    const currentItems = routine.ReadLearn || [];
    const updatedItems = currentItems.filter((_, i) => i !== index);
    onInputChange({ target: { value: updatedItems } }, 'ReadLearn');
  };

  // status pill shown in view mode: green = done, amber = passed, gray = not done
  const StatusPill = ({ value }) => {
    const done = value === true;
    const passed = value === 'Pass';
    return (
      <span
        className="mc-mono text-[11px] px-2 py-0.5 rounded"
        style={{
          color: done ? '#35c48b' : passed ? '#f5a623' : '#e7eaee',
          background: done ? 'rgba(53,196,139,0.12)' : passed ? 'rgba(245,166,35,0.12)' : 'rgba(255,255,255,0.08)',
          border: done || passed ? 'none' : '1px solid rgba(255,255,255,0.16)',
        }}
      >
        {done ? 'Yes' : passed ? 'Pass' : 'No'}
      </span>
    );
  };

  const PassButton = ({ routineKey, active }) =>
    canPass(routineKey) &&
    !active && (
      <button
        onClick={() => handlePass(routineKey)}
        className="mc-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.06] border border-white/20 text-[#e7eaee] hover:bg-[#f5a623]/15 hover:text-[#f5a623] hover:border-[#f5a623]"
      >
        Pass
      </button>
    );

  const BoolRow = ({ label, target, routineKey }) => {
    const value = routine[routineKey];
    return (
      <div className="mc-row" style={{ gridTemplateColumns: '3px 1fr auto' }}>
        <span
          className="rail"
          style={{ background: value === true ? '#35c48b' : value === 'Pass' ? '#f5a623' : '#3a3f47' }}
        />
        <span className="rname">
          {label} <span className="text-[#8a919c]">({target}x/wk)</span>
        </span>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => onInputChange(e, routineKey)}
                disabled={value === 'Pass'}
                className={`mc-check appearance-none ${value === true ? 'on' : ''}`}
              />
              <PassButton routineKey={routineKey} active={value === true} />
            </>
          ) : (
            <StatusPill value={value} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mc-panel relative w-full p-4" style={{ background: '#171a1f', borderColor: 'rgba(255,255,255,0.14)' }}>
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 text-[#5b626d] hover:text-[#f0426a] transition-colors"
        aria-label="delete routine entry"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-col">
        {/* Date */}
        <div className="mb-3">
          {isEditing ? (
            <input
              type="text"
              value={routine.Date}
              onChange={(e) => onInputChange(e, 'Date')}
              className={inputCls + ' max-w-[160px]'}
            />
          ) : (
            <span className="mc-chip">{routine.Date}</span>
          )}
        </div>

        {/* Section Header */}
        <div className="mc-label mb-2">Daily Routines</div>

        <div className="grid md:grid-cols-2 gap-x-4">
          <div>
            <BoolRow label="Mobility" target={5} routineKey="Mobility" />
            <BoolRow label="Language" target={5} routineKey="Language" />
            <BoolRow label="Piano" target={5} routineKey="Piano" />
          </div>

          {/* Exercise - 2 Lift + 3 Cardio per week */}
          <div>
            <div className="mc-row" style={{ gridTemplateColumns: '3px 1fr auto' }}>
              <span
                className="rail"
                style={{
                  background:
                    routine.Exercise === 'Lift' || routine.Exercise === 'Cardio'
                      ? '#35c48b'
                      : routine.Exercise === 'Pass'
                        ? '#f5a623'
                        : '#3a3f47',
                }}
              />
              <span className="rname">
                Exercise <span className="text-[#8a919c]">(2L/3C)</span>
              </span>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <select
                      value={routine.Exercise === 'Pass' ? '' : routine.Exercise || ''}
                      onChange={(e) => onInputChange({ target: { value: e.target.value || null } }, 'Exercise')}
                      disabled={routine.Exercise === 'Pass'}
                      className="bg-[#0c0d10] border border-white/20 rounded px-2 py-1 text-[12px] text-[#e7eaee] outline-none focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee]"
                    >
                      <option value="">None</option>
                      <option value="Lift">Lift</option>
                      <option value="Cardio">Cardio</option>
                    </select>
                    <PassButton routineKey="Exercise" active={!!routine.Exercise && routine.Exercise !== 'Pass'} />
                  </>
                ) : (
                  <span
                    className="mc-mono text-[11px] px-2 py-0.5 rounded"
                    style={{
                      color: routine.Exercise && routine.Exercise !== 'Pass' ? '#35c48b' : routine.Exercise === 'Pass' ? '#f5a623' : '#e7eaee',
                      background:
                        routine.Exercise && routine.Exercise !== 'Pass'
                          ? 'rgba(53,196,139,0.12)'
                          : routine.Exercise === 'Pass'
                            ? 'rgba(245,166,35,0.12)'
                            : 'rgba(255,255,255,0.08)',
                      border: routine.Exercise ? 'none' : '1px solid rgba(255,255,255,0.16)',
                    }}
                  >
                    {routine.Exercise || 'None'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Read/Learn Section - 7x/week */}
        <div className="mt-4 pt-4 border-t border-white/[0.08]">
          <div className="mc-label mb-2">Read/Learn (7x/wk)</div>

          <div className="mb-2">
            {(routine.ReadLearn || []).length > 0 ? (
              (routine.ReadLearn || []).map((item, index) => (
                <div key={index} className="mc-row" style={{ gridTemplateColumns: '3px 1fr auto' }}>
                  <span className="rail" style={{ background: '#35c48b' }} />
                  <span className="rname truncate">
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[#22d3ee] hover:underline">
                        {item.text}
                      </a>
                    ) : (
                      item.text
                    )}
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveReadLearn(index)}
                      className="text-[#5b626d] hover:text-[#f0426a]"
                      aria-label="remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="mc-mono text-[11px] text-[#8a919c] italic py-2">No items yet</p>
            )}
          </div>

          {isEditing && (
            <div className="flex flex-col gap-2 mt-2">
              <input
                type="text"
                value={newReadLearnText}
                onChange={(e) => setNewReadLearnText(e.target.value)}
                placeholder="What did you read/learn?"
                className={inputCls}
              />
              <input
                type="url"
                value={newReadLearnLink}
                onChange={(e) => setNewReadLearnLink(e.target.value)}
                placeholder="Link (optional)"
                className={inputCls}
              />
              <button onClick={handleAddReadLearn} className={btnCls}>
                Add Item
              </button>
            </div>
          )}
        </div>

        {/* Journal Section - 7x/week */}
        <div className="mt-4 pt-4 border-t border-white/[0.08]">
          <div className="mc-label mb-2">Journal (7x/wk)</div>
          {isEditing ? (
            <textarea
              value={routine.Journal || ''}
              onChange={(e) => onInputChange(e, 'Journal')}
              className={inputCls + ' h-24 resize-none'}
              placeholder="Write your daily reflection..."
            />
          ) : (
            <p className={`text-[13px] whitespace-pre-wrap ${routine.Journal ? 'text-[#e7eaee]' : 'text-[#8a919c] italic'}`}>
              {routine.Journal || 'No journal entry'}
            </p>
          )}
        </div>
      </div>

      {/* Edit/Save Button */}
      <div className="flex justify-center border-t border-white/[0.08] pt-4 mt-4">
        {isEditing ? (
          <button onClick={onSave} className={btnPrimaryCls}>
            Save
          </button>
        ) : (
          <button onClick={onEditToggle} className={btnCls}>
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default RoutineCard;
