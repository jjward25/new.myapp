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
    <div className="routine-card bg-slate-100 p-4 rounded-lg shadow-lg relative my-4 w-full border border-black drop-shadow-md">
      <button
        onClick={handleDelete}
        className={`absolute top-4 right-5 rounded-lg hover:scale-95 ${isEditing ? 'text-cyan-700 bg-slate-800 border-white hover:text-fuchsia-400' : 'text-cyan-700 bg-black border border-cyan-200 hover:text-fuchsia-400'}`}
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
        <div className='flex flex-col md:grid md:grid-cols-2 mb-2 overflow-hidden rounded-lg text-xs'>
          {/*** Daily Checklist Section ***/}
          <div className='md:mr-5 md:ml-6 mb-4 md:mb-0'>
            <p className='pl-1 mb-4 md:mb-2 border-b border-cyan-200 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700'>Daily Checklist:</p>
              {/* Daily Checklist Content Section */}
              <div className='bg-neutral-100 rounded-lg px-1 md:px-0 h-full'>

              {/* Workout */}
              <div className="flex items-center mb-2 p-1 rounded">
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
                    <p className={`px-3 inline-block ${routine.Workout ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine.Workout ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Creative */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Creative:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Creative"]}
                        onChange={(e) => onInputChange(e, 'Creative')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Creative</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Creative"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Creative"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Skill Dev */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Skill Dev:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Skill Dev"]}
                        onChange={(e) => onInputChange(e, 'Skill Dev')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Skill Dev</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Skill Dev"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Skill Dev"] ? 'True' : 'False'}
                    </p>
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
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Social Activities"]}
                        onChange={(e) => onInputChange(e, 'Social Activities')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Social Activities</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Social Activities"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Social Activities"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Job Search */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Job Search:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Job Search"]}
                        onChange={(e) => onInputChange(e, 'Job Search')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Job Search</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Job Search"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Job Search"] ? 'True' : 'False'}
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
            <p className='pl-1 mb-4 md:mb-2 border-b border-cyan-200 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700'>Daily Review:</p>
            
            {/* Daily Review List */}
            <div className='bg-neutral-100 rounded-lg px-1 md:px-0 h-full'>
            
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

              {/* Diet Score */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Diet Score:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="number"
                      value={routine["Diet Score"]}
                      onChange={(e) => onInputChange(e, 'Diet Score')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="px-3 inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white">{routine["Diet Score"]}</p>
                  )}
                </div>
              </div>

              {/* Discipline Score */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Discipline Score:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="number"
                      value={routine["Discipline Score"]}
                      onChange={(e) => onInputChange(e, 'Discipline Score')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Discipline Score"]}</p>
                  )}
                </div>
              </div>

              {/* Daily Score */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Daily Score:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="number"
                      value={routine["Daily Score"]}
                      onChange={(e) => onInputChange(e, 'Daily Score')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Daily Score"]}</p>
                  )}
                </div>
              </div>

              
            </div>
          </div>
        </div>

        {/* Journal */}
        <div className="flex flex-col justify-start mb-2 py-1 md:mx-6 pt-4 rounded text-sm border-t border-t-cyan-200">
          
          {/* Social Activities */}
          <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Social Activities:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="text"
                      value={routine["Social Desc"]}
                      onChange={(e) => onInputChange(e, 'Social Desc')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Social Desc"]}</p>
                  )}
                </div>
              </div>
              
          {/* Creative Summary */}
          <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Creative Summary:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="text"
                      value={routine["Creative Desc"]}
                      onChange={(e) => onInputChange(e, 'Creative Desc')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Creative Desc"]}</p>
                  )}
                </div>
              </div>

          {/* Skill Summary */}
          <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Skill Summary:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="text"
                      value={routine["Skill Desc"]}
                      onChange={(e) => onInputChange(e, 'Skill Desc')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white px-3">{routine["Skill Desc"]}</p>
                  )}
                </div>
              </div>

          {/* Job Search Summary */}
          <div className="flex items-center mb-2 p-1 pb-4 rounded border-b border-b-cyan-200">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Search Summary:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="text"
                      value={routine["Job Search Desc"]}
                      onChange={(e) => onInputChange(e, 'Job Search Desc')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white px-3">{routine["Job Search Desc"]}</p>
                  )}
                </div>
              </div>
          
          {/* Journal */}
          <div className="w-full">
            <label className="block border-b border-cyan-200 font-bold text-black text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700 pb-2">Journal:</label>
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