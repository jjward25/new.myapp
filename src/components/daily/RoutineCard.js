"use client";
import React from 'react';
import axios from 'axios';

const RoutineCard = ({ routine, isEditing, onInputChange, onEditToggle, onSave, onDelete }) => {
  const handleDelete = async () => {
    try {
      await axios.delete('/api/routines', { data: { id: routine._id } });
      onDelete(routine._id); // Notify the parent component about the delete action
    } catch (err) {
      console.error('Error deleting routine:', err);
    }
  };

  return (
    <div className="routine-card bg-white p-4 rounded-lg shadow-lg relative my-4 max-w-[1000px]">
      <button
        onClick={handleDelete}
        className="absolute top-4 right-5 bg-black border border-cyan-200 text-cyan-700 hover:text-red-800 rounded-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
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
        
        {/*** Split Section ***/}
        <div className='flex flex-col md:grid md:grid-cols-2 mb-6 overflow-hidden rounded-lg text-xs'>
          {/*** Daily Checklist Section ***/}
          <div className='md:mr-5 md:ml-6 mb-8 md:mb-0'>
            <p className='pl-1 mb-5 border-b border-cyan-200 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700'>Daily Checklist:</p>
              {/* Daily Checklist Content Section */}
              <div className='bg-neutral-100 rounded-lg p-2 h-full'>
              {/* Sleep Score */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Sleep Score:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="number"
                      value={routine["Sleep Score"]}
                      onChange={(e) => onInputChange(e, 'Sleep Score')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="px-3 inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white">{routine["Sleep Score"]}</p>
                  )}
                </div>
              </div>

              {/* Fab Morning */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Fab Morning:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Fab Morning"]}
                        onChange={(e) => onInputChange(e, 'Fab Morning')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Fab Morning</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Fab Morning"] ? 'text-cyan-500' : 'text-purple-600'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Fab Morning"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Work Score */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Work Score:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="number"
                      value={routine["Work Score"]}
                      onChange={(e) => onInputChange(e, 'Work Score')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="px-3 inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white">{routine["Work Score"]}</p>
                  )}
                </div>
              </div>

              {/* Workout */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Workout:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine.Workout}
                        onChange={(e) => onInputChange(e, 'Workout')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Workout</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine.Workout ? 'text-cyan-500' : 'text-purple-600'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine.Workout ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Piano */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Piano:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine.Piano}
                        onChange={(e) => onInputChange(e, 'Piano')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Piano</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine.Piano ? 'text-cyan-500' : 'text-purple-600'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine.Piano ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Prof Dev */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Prof Dev:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Prof Dev"]}
                        onChange={(e) => onInputChange(e, 'Prof Dev')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Prof Dev</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Prof Dev"] ? 'text-cyan-500' : 'text-purple-600'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Prof Dev"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Spanish */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Spanish:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine.Spanish}
                        onChange={(e) => onInputChange(e, 'Spanish')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Spanish</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine.Spanish ? 'text-cyan-500' : 'text-purple-600'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine.Spanish ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Fab Evening */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Fab Evening:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Fab Evening"]}
                        onChange={(e) => onInputChange(e, 'Fab Evening')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Fab Evening</span>
                    </label>
                  ) : (
                    <p className={` px-3 inline-block ${routine["Fab Evening"] ? 'text-cyan-500' : 'text-purple-600'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Fab Evening"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          {/* End Daily Checklist Content Section */}
          </div>
          {/* End Daily Checklist Section */}

          {/*** Daily Review Section ***/}
          <div className='md:mr-6 md:ml-5 '> 
            <p className='pl-1 mb-5 border-b border-cyan-200 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700'>Daily Review:</p>
            {/* Daily Review List */}
            <div className='bg-neutral-100 rounded-lg p-2 h-full'>
              {/* Protein % */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Protein %:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={routine["Protein %"]}
                      onChange={(e) => onInputChange(e, 'Protein %')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Protein %"]}</p>
                  )}
                </div>
              </div>

              {/* Calories % */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-black text-sm font-semibold">Calories %:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={routine["Calories %"]}
                      onChange={(e) => onInputChange(e, 'Calories %')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Calories %"]}</p>
                  )}
                </div>
              </div>

              {/* Social Activities */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Social Activities:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="text"
                      value={routine["Social Activities"]}
                      onChange={(e) => onInputChange(e, 'Social Activities')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Social Activities"]}</p>
                  )}
                </div>
              </div>

              {/* Mood Score */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Mood Score:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="number"
                      value={routine["Mood Score"]}
                      onChange={(e) => onInputChange(e, 'Mood Score')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Mood Score"]}</p>
                  )}
                </div>
              </div>

              {/* Mood Summary */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Mood Summary:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="text"
                      value={routine["Mood Summary"]}
                      onChange={(e) => onInputChange(e, 'Mood Summary')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Mood Summary"]}</p>
                  )}
                </div>
              </div>

              {/* Performance Score */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Performance Score:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="number"
                      value={routine["Performance Score"]}
                      onChange={(e) => onInputChange(e, 'Performance Score')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Performance Score"]}</p>
                  )}
                </div>
              </div>

              {/* Performance Rating */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Performance Summary:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="text"
                      value={routine["Performance Summary"]}
                      onChange={(e) => onInputChange(e, 'Performance Summary')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white px-3">{routine["Performance Summary"]}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Journal */}
        <div className="flex flex-col justify-start mb-2 py-1 md:px-6 rounded text-sm">
          <div className="w-full">
            <label className="block border-b border-cyan-200 font-bold text-black text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">Journal:</label>
          </div>
          <div className="w-full">
            {isEditing ? (
              <input
                type="text"
                value={routine.Journal}
                onChange={(e) => onInputChange(e, 'Journal')}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            ) : (
              <p className="inline-block py-3 text-cyan-600 bg-gradient-to-br from-black via-slate-800 to-neutral-800 px-3 rounded-lg w-full min-h-10 mt-4">{routine.Journal}</p>
            )}
          </div>
        </div>
      </div>

      <div className='flex justify-center border-t border-cyan-200 pt-6 mx-6'>
      {isEditing ? (
        <button
          onClick={onSave}
          className="btn px-6 border-black btn-secondary bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 hover:bg-black text-black w-auto"
        >
          Save
        </button>
      ) : (
        <button
          onClick={onEditToggle}
          className="btn px-6 border-cyan-500 hover:border-cyan-700 btn-secondary bg-gradient-to-br from-black via-slate-800 to-neutral-800 hover:bg-black text-cyan-700 w-auto"
        >
          Edit
        </button>
      )}
      </div>
    </div>
  );
};

export default RoutineCard;
