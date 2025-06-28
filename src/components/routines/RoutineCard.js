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

  // Calculate Daily Score automatically
  const calculateDailyScore = (routineData) => {
    const mainActivities = [
      routineData["Morning Exercise"],
      routineData["Evening Exercise"],
      routineData["Applications"]
    ];
    
    const bonusActivities = [
      routineData["Language"],
      routineData["Piano"],
      routineData["Reading"],
      routineData["Writing"],
      routineData["Social"],
      routineData["Cook/Meal Prep"],
      routineData["Coding"],
      routineData["Prof Dev"]
    ];

    const mainCount = mainActivities.filter(Boolean).length;
    const bonusCount = bonusActivities.filter(Boolean).length;

    if (mainCount === 0) return 0;
    if (mainCount === 1) return 1;
    if (mainCount === 2) return bonusCount > 0 ? 3 : 2;
    if (mainCount === 3) return bonusCount > 0 ? 4 : 3;
    
    return 0;
  };

  const currentScore = calculateDailyScore(routine);

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
        <p className='pl-1 mb-4 mx-4 md:mb-2 border-b border-cyan-200 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700'>Daily Routines</p>
        <div className='flex flex-col md:grid md:grid-cols-2 mb-2 overflow-hidden rounded-lg text-xs'>

          {/*** Main Routines (Left Column) ***/}
          <div className='md:mr-5 md:ml-6 mb-4 md:mb-0'>
            <div className='bg-neutral-100 rounded-lg px-1 md:px-0 h-full'>

              {/* Morning Exercise */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Morning Exercise:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine['Morning Exercise']}
                        onChange={(e) => onInputChange(e, 'Morning Exercise')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Morning Exercise</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine['Morning Exercise'] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine['Morning Exercise'] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Evening Exercise */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Evening Exercise:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine['Evening Exercise']}
                        onChange={(e) => onInputChange(e, 'Evening Exercise')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Evening Exercise</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine['Evening Exercise'] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine['Evening Exercise'] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Applications */}
              <div className="flex items-center mb-2 p-1 bg-black rounded-lg">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-white">Applications:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Applications"]}
                        onChange={(e) => onInputChange(e, 'Applications')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Applications</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Applications"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Applications"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Fresh Air */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Fresh Air:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine['Fresh Air']}
                        onChange={(e) => onInputChange(e, 'Fresh Air')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Fresh Air</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine['Fresh Air'] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine['Fresh Air'] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/*** Bonus Activities (Right Column) ***/}
          <div className='md:mr-6 md:ml-5'> 
            <div className='bg-neutral-100 rounded-lg px-1 md:px-0 h-full'>
                  
              {/* Language */}
              <div className="flex items-center mb-2 p-1 rounded">
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

              {/* Piano */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Piano:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Piano"]}
                        onChange={(e) => onInputChange(e, 'Piano')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Piano</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Piano"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Piano"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Reading */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Reading:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Reading"]}
                        onChange={(e) => onInputChange(e, 'Reading')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Reading</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Reading"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Reading"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Writing */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Writing:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Writing"]}
                        onChange={(e) => onInputChange(e, 'Writing')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Writing</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Writing"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Writing"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Social */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Social:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Social"]}
                        onChange={(e) => onInputChange(e, 'Social')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Social</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Social"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Social"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Cook/Meal Prep */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Cook/Meal Prep:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Cook/Meal Prep"]}
                        onChange={(e) => onInputChange(e, 'Cook/Meal Prep')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Cook/Meal Prep</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Cook/Meal Prep"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Cook/Meal Prep"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Coding */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Coding:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Coding"]}
                        onChange={(e) => onInputChange(e, 'Coding')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Coding</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Coding"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Coding"] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Prof Dev */}
              <div className="flex items-center mb-2 p-1 rounded">
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
              
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col justify-start mb-2 py-1 md:mx-6 pt-4 rounded text-sm border-t border-t-cyan-200">
          {/* Daily Score */}
          <div className="flex items-center mb-2 p-1 rounded pb-4 border-b border-b-cyan-200">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Daily Score:</label>
                </div>
                <div className="w-auto text-xs">
                  <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white px-3">{currentScore}</p>
                </div>
               
          </div>
          
          {/* Journal */}
          <div className="w-full">
            <label className="block font-bold text-black text-xl bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">Journal:</label>
          </div>
          <div className="w-full">
            {isEditing ? (
              <textarea
                value={routine.Journal}
                onChange={(e) => onInputChange(e, 'Journal')}
                className="textarea textarea-bordered bg-neutral-100 text-cyan-700 w-full h-24"
                placeholder="Write your daily reflection..."
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