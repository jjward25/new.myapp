"use client";
import React, { useState } from 'react';
import NewDailyForm from './NewDailyForm';

const AddRoutineButton = () => {
  const [isFormVisible, setFormVisible] = useState(false);

  const handleRoutineAdded = (newRoutine) => {
    console.log('Routine added:', newRoutine);
    setFormVisible(false); // Hide the form after adding
  };

  const handleOutsideClick = (e) => {
    if (e.target.id === 'form-overlay') {
      setFormVisible(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setFormVisible(true)}
        className="btn px-6 border-cyan-700 hover:border-cyan-500 btn-secondary bg-gradient-to-br from-black via-slate-800 to-neutral-800 hover:bg-black text-cyan-700 w-full max-w-[1000px]"
      >
        New Day
      </button>

      {isFormVisible && (
        <div
          id="form-overlay"
          onClick={handleOutsideClick}
          className="fixed inset-0 bg-neutral-900 bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-4 rounded shadow-lg w-full max-w-[1000px] relative z-60 max-h-[90vh] overflow-auto">
            <button
              onClick={() => setFormVisible(false)}
              className="btn btn-outline text-neutral-700 hover:bg-neutral-200 absolute top-2 right-2"
            >
              Close
            </button>
            <NewDailyForm onRoutineAdded={handleRoutineAdded} />
          </div>
        </div>
      )}
    </>
  );
};

export default AddRoutineButton;
