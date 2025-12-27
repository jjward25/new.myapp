"use client";
import React, { useState } from 'react';
import axios from 'axios';

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
      link: newReadLearnLink.trim() || null
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

  return (
    <div className="routine-card bg-slate-100 p-4 rounded-lg shadow-lg relative my-4 w-full border border-black drop-shadow-md">
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className={`absolute top-4 right-5 rounded-lg hover:scale-95 ${isEditing ? 'text-cyan-700 bg-slate-800 border-white hover:text-fuchsia-400' : 'text-cyan-700 bg-black border border-cyan-200 hover:text-fuchsia-400'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-col">
        {/* Date */}
        <div className="flex items-center md:ml-1 mb-3 py-1 md:px-1 rounded">
          <div className="w-auto">
            {isEditing ? (
              <input
                type="text"
                value={routine.Date}
                onChange={(e) => onInputChange(e, 'Date')}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            ) : (
              <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 text-cyan-500 font-semibold p-1 px-3 rounded-xl text-sm">{routine.Date}</p>
            )}
          </div>
        </div>
        
        {/* Section Header */}
        <p className='pl-1 mb-4 mt-4 mx-4 md:mb-2 border-b border-cyan-200 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700'>Daily Routines</p>
        
        <div className='flex flex-col md:grid md:grid-cols-2 mb-2 overflow-hidden rounded-lg text-xs'>
          {/* Left Column - Boolean Activities */}
          <div className='md:mr-5 md:ml-6 mb-4 md:mb-0'>
            <div className='bg-neutral-100 rounded-lg px-1 md:px-0 h-full'>

              {/* Mobility - 5x/week */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Mobility (5x/wk):</label>
                </div>
                <div className="w-auto flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        type="checkbox"
                        checked={routine.Mobility === true}
                        onChange={(e) => onInputChange(e, 'Mobility')}
                        className="checkbox checkbox-primary"
                        disabled={routine.Mobility === 'Pass'}
                      />
                      {canPass('Mobility') && routine.Mobility !== true && (
                        <button
                          onClick={() => handlePass('Mobility')}
                          className={`px-2 py-0.5 text-xs rounded ${routine.Mobility === 'Pass' ? 'bg-amber-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-amber-400'}`}
                        >
                          {routine.Mobility === 'Pass' ? 'Passed' : 'Pass'}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className={`px-3 inline-block ${routine.Mobility === true ? 'text-cyan-500' : routine.Mobility === 'Pass' ? 'text-amber-400' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine.Mobility === true ? 'Yes' : routine.Mobility === 'Pass' ? 'Pass' : 'No'}
                    </p>
                  )}
                </div>
              </div>

              {/* Language - 5x/week */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Language (5x/wk):</label>
                </div>
                <div className="w-auto flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        type="checkbox"
                        checked={routine.Language === true}
                        onChange={(e) => onInputChange(e, 'Language')}
                        className="checkbox checkbox-primary"
                        disabled={routine.Language === 'Pass'}
                      />
                      {canPass('Language') && routine.Language !== true && (
                        <button
                          onClick={() => handlePass('Language')}
                          className={`px-2 py-0.5 text-xs rounded ${routine.Language === 'Pass' ? 'bg-amber-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-amber-400'}`}
                        >
                          {routine.Language === 'Pass' ? 'Passed' : 'Pass'}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className={`px-3 inline-block ${routine.Language === true ? 'text-cyan-500' : routine.Language === 'Pass' ? 'text-amber-400' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine.Language === true ? 'Yes' : routine.Language === 'Pass' ? 'Pass' : 'No'}
                    </p>
                  )}
                </div>
              </div>

              {/* Piano - 5x/week */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Piano (5x/wk):</label>
                </div>
                <div className="w-auto flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        type="checkbox"
                        checked={routine.Piano === true}
                        onChange={(e) => onInputChange(e, 'Piano')}
                        className="checkbox checkbox-primary"
                        disabled={routine.Piano === 'Pass'}
                      />
                      {canPass('Piano') && routine.Piano !== true && (
                        <button
                          onClick={() => handlePass('Piano')}
                          className={`px-2 py-0.5 text-xs rounded ${routine.Piano === 'Pass' ? 'bg-amber-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-amber-400'}`}
                        >
                          {routine.Piano === 'Pass' ? 'Passed' : 'Pass'}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className={`px-3 inline-block ${routine.Piano === true ? 'text-cyan-500' : routine.Piano === 'Pass' ? 'text-amber-400' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine.Piano === true ? 'Yes' : routine.Piano === 'Pass' ? 'Pass' : 'No'}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column - Exercise Dropdown */}
          <div className='md:mr-6 md:ml-5'> 
            <div className='bg-neutral-100 rounded-lg px-1 md:px-0 h-full'>
              
              {/* Exercise - 2 Lift + 3 Cardio per week */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Exercise (2L/3C):</label>
                </div>
                <div className="w-auto flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <select
                        value={routine.Exercise === 'Pass' ? '' : (routine.Exercise || '')}
                        onChange={(e) => onInputChange({ target: { value: e.target.value || null } }, 'Exercise')}
                        className="select select-bordered select-sm bg-neutral-100 text-cyan-700"
                        disabled={routine.Exercise === 'Pass'}
                      >
                        <option value="">None</option>
                        <option value="Lift">Lift</option>
                        <option value="Cardio">Cardio</option>
                      </select>
                      {canPass('Exercise') && !routine.Exercise && (
                        <button
                          onClick={() => handlePass('Exercise')}
                          className={`px-2 py-0.5 text-xs rounded ${routine.Exercise === 'Pass' ? 'bg-amber-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-amber-400'}`}
                        >
                          {routine.Exercise === 'Pass' ? 'Passed' : 'Pass'}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className={`px-3 inline-block ${routine.Exercise && routine.Exercise !== 'Pass' ? 'text-cyan-500' : routine.Exercise === 'Pass' ? 'text-amber-400' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine.Exercise || 'None'}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Read/Learn Section - 7x/week */}
        <div className="flex flex-col justify-start mb-2 py-1 md:mx-6 pt-4 rounded text-sm border-t border-t-cyan-200">
          <div className="w-full mb-2">
            <label className="block font-bold text-black text-lg bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">Read/Learn (7x/wk):</label>
          </div>
          
          {/* List of Read/Learn items */}
          <div className="w-full mb-2">
            {(routine.ReadLearn || []).length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {(routine.ReadLearn || []).map((item, index) => (
                  <li key={index} className="flex items-center justify-between bg-gradient-to-br from-black via-slate-800 to-neutral-800 px-3 py-1 rounded-lg">
                    <span className="text-cyan-400">
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:text-fuchsia-400 underline">
                          {item.text}
                        </a>
                      ) : (
                        item.text
                      )}
                    </span>
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveReadLearn(index)}
                        className="text-red-400 hover:text-red-600 ml-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500 italic text-xs">No items yet</p>
            )}
          </div>

          {/* Add new Read/Learn item (only in edit mode) */}
          {isEditing && (
            <div className="flex flex-col gap-2 mt-2 bg-neutral-200 p-2 rounded-lg">
              <input
                type="text"
                value={newReadLearnText}
                onChange={(e) => setNewReadLearnText(e.target.value)}
                placeholder="What did you read/learn?"
                className="input input-bordered input-sm bg-neutral-100 text-cyan-700 w-full"
              />
              <input
                type="url"
                value={newReadLearnLink}
                onChange={(e) => setNewReadLearnLink(e.target.value)}
                placeholder="Link (optional)"
                className="input input-bordered input-sm bg-neutral-100 text-cyan-700 w-full"
              />
              <button
                onClick={handleAddReadLearn}
                className="btn btn-sm bg-cyan-700 text-white hover:bg-cyan-600"
              >
                Add Item
              </button>
            </div>
          )}
        </div>

        {/* Journal Section - 7x/week */}
        <div className="flex flex-col justify-start mb-2 py-1 md:mx-6 pt-4 rounded text-sm border-t border-t-cyan-200">
          <div className="w-full">
            <label className="block font-bold text-black text-lg bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">Journal (7x/wk):</label>
          </div>
          <div className="w-full">
            {isEditing ? (
              <textarea
                value={routine.Journal || ''}
                onChange={(e) => onInputChange(e, 'Journal')}
                className="textarea textarea-bordered bg-neutral-100 text-cyan-700 w-full h-24"
                placeholder="Write your daily reflection..."
              />
            ) : (
              <p className={`inline-block py-3 ${routine.Journal ? 'text-cyan-600' : 'text-neutral-500 italic'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 px-3 rounded-lg w-full min-h-10 mt-2`}>
                {routine.Journal || 'No journal entry'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit/Save Button */}
      <div className='flex justify-center border-t border-cyan-200 pt-6 mx-6'>
        {isEditing ? (
          <button
            onClick={onSave}
            className="btn px-6 border-black btn-secondary bg-gradient-to-br from-black via-slate-800 to-neutral-800 hover:border-black text-cyan-700 hover:text-fuchsia-400 w-auto hover:scale-95"
          >
            Save
          </button>
        ) : (
          <button
            onClick={onEditToggle}
            className="btn px-6 border-cyan-500 hover:border-cyan-700 btn-secondary bg-gradient-to-br from-black via-slate-800 to-neutral-800 hover:scale-95 text-cyan-700 hover:text-fuchsia-400 w-auto"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default RoutineCard;
