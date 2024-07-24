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

  // Function to get text color based on boolean value
  const getTextColor = (value) => {
    return value ? 'text-blue-500' : 'text-red-500';
  };

  // Functions to get specific styling for a given key
  const getKeyStyle = (key) => {
    switch (key) {
      case 'Workout':
        return 'text-base'; // Example style for "Workout"
      case 'Journal':
        return 'text-base'; // Example style for "Journal"
      default:
        return 'text-base';
    }
  };

  const getValueStyle = (key) => {
    switch (key) {
      case 'Workout':
        return 'bg-gray-100 p-2 rounded'; // Example style for "Workout"
      case 'Journal':
        return 'bg-gray-100 p-2 rounded'; // Example style for "Journal"
      default:
        return 'bg-gray-100 p-2 rounded';
    }
  };

  const getParentStyle = (key) => {
    switch (key) {
      case 'Workout':
        return ''; // Example style for "Workout"
      case 'Journal':
        return ''; // Example style for "Journal"
      default:
        return '';
    }
  };

  return (
    <div className="routine-card bg-white p-4 rounded-lg shadow-lg relative my-4 justify-start">
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
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
      <div className="grid grid-cols-1 gap-1">
        {Object.entries(routine).map(([key, value]) => (
          key != '_id' &&
          <div key={key} className={`flex items-center mb-4 ${getParentStyle(key)}`}>
            <div className="w-auto mr-2">
              <label className={`block ${getKeyStyle(key)}`}>{key}:</label>
            </div>
            <div className="w-auto">
              {isEditing ? (
                typeof value === 'boolean' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => onInputChange(e, key)}
                      className="checkbox checkbox-primary"
                    />
                    <span className="ml-2">{key}</span>
                  </label>
                ) : (
                  <input
                    type={typeof value === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => onInputChange(e, key)}
                    className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
                  />
                )
              ) : (
                <p className={`inline-block ${getTextColor(value)} ${getValueStyle(key)}`}>
                  {typeof value === 'boolean' ? (value ? 'True' : 'False') : value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {isEditing ? (
        <button
          onClick={onSave}
          className="btn btn-primary bg-cyan-700 hover:bg-cyan-800 text-neutral-100 w-full mt-4"
        >
          Save
        </button>
      ) : (
        <button
          onClick={onEditToggle}
          className="btn btn-secondary bg-neutral-400 hover:bg-neutral-500 text-cyan-700 w-full mt-4"
        >
          Edit
        </button>
      )}
    </div>
  );
};

export default RoutineCard;
