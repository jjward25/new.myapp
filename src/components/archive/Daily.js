"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditableRoutine = () => {
  const [routine, setRoutine] = useState(null);
  const [editableRoutine, setEditableRoutine] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchMostRecentRoutine = async () => {
      try {
        const response = await axios.get('/api/routines/recent');
        setRoutine(response.data[0]); // Assume response.data is an array
        setEditableRoutine(response.data[0]);
      } catch (err) {
        console.error('Error fetching most recent routine:', err);
      }
    };

    fetchMostRecentRoutine();
  }, []);

  const handleInputChange = (e, key) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditableRoutine({ ...editableRoutine, [key]: value });
  };

  const handleSave = async () => {
    try {
      await axios.put('/api/routines', { id: routine._id, updatedItem: editableRoutine });
      setRoutine(editableRoutine);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating routine:', err);
    }
  };

  if (!routine) {
    return <p>Loading...</p>;
  }

  return (
    <div className="routine-card bg-white p-4 rounded-lg shadow-lg">
      {Object.entries(editableRoutine).map(([key, value]) => (
        <div key={key} className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">{key}:</label>
          {isEditing ? (
            typeof value === 'boolean' ? (
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleInputChange(e, key)}
                className="input input-bordered bg-neutral-100 text-cyan-700"
              />
            ) : (
              <input
                type={typeof value === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => handleInputChange(e, key)}
                className="input input-bordered bg-neutral-100 text-cyan-700 w-full"
              />
            )
          ) : (
            <p>{value}</p>
          )}
        </div>
      ))}
      {isEditing ? (
        <button
          onClick={handleSave}
          className="btn btn-primary bg-cyan-700 hover:bg-cyan-800 text-neutral-100 w-full"
        >
          Save
        </button>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-secondary bg-neutral-400 hover:bg-neutral-500 text-cyan-700 w-full"
        >
          Edit
        </button>
      )}
    </div>
  );
};

export default EditableRoutine;
