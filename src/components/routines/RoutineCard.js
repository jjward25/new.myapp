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
        <p className='pl-1 mb-4 mx-4 md:mb-2 border-b border-cyan-200 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700'>Daily Checklist</p>
        <div className='flex flex-col md:grid md:grid-cols-2 mb-2 overflow-hidden rounded-lg text-xs'>

          {/*** Daily Checklist Left Column ***/}
          <div className='md:mr-5 md:ml-6 mb-4 md:mb-0'>

              {/* Daily Checklist Content Section */}
              <div className='bg-neutral-100 rounded-lg px-1 md:px-0 h-full'>

              {/* 550 Wakeup */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">550 Wakeup:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine['550 Wakeup']}
                        onChange={(e) => onInputChange(e, '550 Wakeup')}
                        className="checkbox checkbox-primary"
                      />
                      <span>550 Wakeup</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine['550 Wakeup'] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine['550 Wakeup'] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* 630 Outside */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">630 Outside:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine['630 Outside']}
                        onChange={(e) => onInputChange(e, '630 Outside')}
                        className="checkbox checkbox-primary"
                      />
                      <span>630 Outside</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine['630 Outside'] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine['630 Outside'] ? 'True' : 'False'}
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

              {/* Small Tasks */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Small Tasks:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Small Tasks"]}
                        onChange={(e) => onInputChange(e, 'Small Tasks')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Small Tasks</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Small Tasks"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Small Tasks"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Workout Type */}
              <div className="flex items-center mb-2 p-1 rounded">
                    <div className="w-auto mr-2">
                      <label className="block text-sm text-black font-semibold">Workout Type:</label>
                    </div>
                    <div className="w-auto">
                      {isEditing ? (
                        <input
                          type="text"
                          value={routine["Workout Type"]}
                          onChange={(e) => onInputChange(e, 'Workout Type')}
                          className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                        />
                      ) : (
                        <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white px-3">{routine["Workout Type"]}</p>
                      )}
                    </div>
                  </div>

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

              {/* Learning */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Learning:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Learning"]}
                        onChange={(e) => onInputChange(e, 'Learning')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Learning</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Learning"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Learning"] ? 'True' : 'False'}
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
                    <p className={`px-3 inline-block ${routine["Prof Dev"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Prof Dev"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Lunch */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Lunch:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Lunch"]}
                        onChange={(e) => onInputChange(e, 'Lunch')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Lunch</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Lunch"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Lunch"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

            </div>
          {/* End Daily Checklist Content Section */}
          </div>
          {/* End Daily Checklist Section */}

          {/*** Daily Review (Right Column) ***/}
          <div className='md:mr-6 md:ml-5 '> 
            
            {/* Daily Review List */}
            <div className='bg-neutral-100 rounded-lg px-1 md:px-0 h-full'>
            
              {/* Language */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Language:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Language"]}
                        onChange={(e) => onInputChange(e, 'Language')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Language</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Language"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Language"] ? 'True' : 'False'}
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

              {/* Passion */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">PersonalPrj:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Passion"]}
                        onChange={(e) => onInputChange(e, 'Passion')}
                        className="checkbox checkbox-primary"
                      />
                      <span>PersonalPrj</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Passion"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Passion"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Call */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Call:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Call"]}
                        onChange={(e) => onInputChange(e, 'Call')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Call</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Call"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Call"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Call Name */}
              <div className="flex items-center mb-2 p-1 rounded">
                    <div className="w-auto mr-2">
                      <label className="block text-sm text-black font-semibold">Call Name:</label>
                    </div>
                    <div className="w-auto">
                      {isEditing ? (
                        <input
                          type="text"
                          value={routine["Call Name"]}
                          onChange={(e) => onInputChange(e, 'Call Name')}
                          className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                        />
                      ) : (
                        <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white px-3">{routine["Call Name"]}</p>
                      )}
                    </div>
                  </div>

              {/* Dinner */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Dinner:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Dinner"]}
                        onChange={(e) => onInputChange(e, 'Dinner')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Dinner</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Dinner"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Dinner"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Personal Time */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Personal Time:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Personal Time"]}
                        onChange={(e) => onInputChange(e, 'Personal Time')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Personal Time</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Personal Time"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Personal Time"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Events */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Events:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Events"]}
                        onChange={(e) => onInputChange(e, 'Events')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Events</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Events"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Events"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* 1030 Bed */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">1030 Bed:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["1030 Bed"]}
                        onChange={(e) => onInputChange(e, '1030 Bed')}
                        className="checkbox checkbox-primary"
                      />
                      <span>1030 Bed</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["1030 Bed"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["1030 Bed"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col justify-start mb-2 py-1 md:mx-6 pt-4 rounded text-sm border-t border-t-cyan-200">
          
             
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

          {/* L&D */}
          <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">L&D Desc:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="text"
                      value={routine["LearningAndDev Desc"]}
                      onChange={(e) => onInputChange(e, 'LearningAndDev Desc')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white px-3">{routine["LearningAndDev Desc"]}</p>
                  )}
                </div>
              </div>

          {/* Events Desc */}
          <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Events Desc:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <input
                      type="text"
                      value={routine["Events Desc"]}
                      onChange={(e) => onInputChange(e, 'Events Desc')}
                      className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                    />
                  ) : (
                    <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white px-3">{routine["Events Desc"]}</p>
                  )}
                </div>
          </div>

          {/* Daily Score */}
          <div className="flex items-center mb-2 p-1 rounded pb-4 border-b border-b-cyan-200">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Daily Score:</label>
                </div>
                <div className="w-auto text-xs">
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
          
          {/* Journal */}
          <div className="w-full">
            <label className="block font-bold text-black text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">Journal:</label>
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
              <p className="inline-block py-3 text-cyan-600 bg-gradient-to-br from-black via-slate-800 to-neutral-800 px-3 rounded-lg w-full min-h-10 mt-2">{routine.Journal}</p>
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