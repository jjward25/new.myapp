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

              {/* Sleep Score */}
              <div className="flex items-center mb-2 p-1 rounded">
                    <div className="w-auto mr-2">
                      <label className="block text-sm text-black font-semibold">Sleep Score:</label>
                    </div>
                    <div className="w-auto text-xs">
                      {isEditing ? (
                        <input
                          type="number"
                          value={routine["Sleep Score"]}
                          onChange={(e) => onInputChange(e, 'Sleep Score')}
                          className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                        />
                      ) : (
                        <p className="inline-block bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg text-white  px-3">{routine["Sleep Score"]}</p>
                      )}
                  </div>
              </div>

              {/* Mobility */}
              <div className="flex items-center mb-2 p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">10m Mobility:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine['Mobility']}
                        onChange={(e) => onInputChange(e, 'Mobility')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Mobility</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine['Mobility'] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine['Mobility'] ? 'True' : 'False'}
                    </p>
                  )}
                </div>
              </div>

              {/* Breakfast */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">Breakfast:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Breakfast"]}
                        onChange={(e) => onInputChange(e, 'Breakfast')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Breakfast</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Breakfast"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Breakfast"] ? 'True' : 'False'}
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

              {/* Language */}
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">15m Language:</label>
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
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">20m Piano:</label>
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
              <div className="flex items-center mb-2  p-1 rounded">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-black font-semibold">30m Reading:</label>
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

            </div>
          {/* End Daily Checklist Content Section */}
          </div>
          {/* End Daily Checklist Section */}

          {/*** Daily Review (Right Column) ***/}
          <div className='md:mr-6 md:ml-5 '> 
            
            {/* Daily Review List */}
            <div className='bg-neutral-100 rounded-lg px-1 md:px-0 h-full'>
                  
                {/* Job Search */}
               <div className="flex items-center mb-2 p-1 bg-black rounded-lg">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-white">Applications:</label>
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

              {/* Tasks */}
              <div className="flex items-center mb-2 p-1 bg-black rounded-lg">
                <div className="w-auto mr-2">
                  <label className="block text-sm text-white">Tasks:</label>
                </div>
                <div className="w-auto">
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={routine["Tasks"]}
                        onChange={(e) => onInputChange(e, 'Tasks')}
                        className="checkbox checkbox-primary"
                      />
                      <span>Tasks</span>
                    </label>
                  ) : (
                    <p className={`px-3 inline-block ${routine["Tasks"] ? 'text-cyan-500' : 'text-fuchsia-500'} bg-gradient-to-br from-black via-slate-800 to-neutral-800 p-1 rounded-lg`}>
                      {routine["Tasks"] ? 'True' : 'False'}
                    </p>
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