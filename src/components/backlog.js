// app/components/BacklogList.js

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const BacklogList = () => {
  const [backlog, setBacklog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editableItem, setEditableItem] = useState({});

  useEffect(() => {
    const fetchBacklog = async () => {
      try {
        const response = await axios.get('/api/backlog');
        setBacklog(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBacklog();
  }, []);

  const handleEditClick = (item) => {
    setEditingItemId(item._id);
    setEditableItem({ ...item });
  };

  const handleInputChange = (e, key) => {
    setEditableItem({ ...editableItem, [key]: e.target.value });
  };

  const handleSaveClick = async (id) => {
    try {
      const { _id, ...fieldsToUpdate } = editableItem;
      await axios.put('/api/backlog', { id, updatedItem: fieldsToUpdate });
      setBacklog(backlog.map((item) => (item._id === id ? { ...fieldsToUpdate, _id: id } : item)));
      setEditingItemId(null);
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleDeleteClick = async (id) => {
    try {
      await axios.delete('/api/backlog', { data: { id } });
      setBacklog(backlog.filter((item) => item._id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-6">
      {backlog.map((item) => (
        <div key={item._id} className="card w-full bg-black border border-cyan-400 shadow-xl rounded-lg">
          <div className="card-body p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-lg font-bold text-cyan-700">ID: {item._id}</h2>
              <button
                onClick={() => handleDeleteClick(item._id)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                &times;
              </button>
            </div>
            {Object.entries(item).map(([key, value]) => (
              key !== '_id' && (
                <div key={key} className="mb-2">
                  <strong className="text-cyan-700">{key}:</strong>
                  {editingItemId === item._id ? (
                    <input
                      type="text"
                      value={editableItem[key] !== undefined ? editableItem[key] : ''}
                      onChange={(e) => handleInputChange(e, key)}
                      className="input input-bordered w-full mt-1 bg-neutral-100 text-cyan-700"
                    />
                  ) : (
                    <span className="ml-2 text-neutral-100">{value !== null && value !== undefined ? value.toString() : 'N/A'}</span>
                  )}
                </div>
              )
            ))}
            {editingItemId === item._id ? (
              <button
                onClick={() => handleSaveClick(item._id)}
                className="btn btn-primary mt-4 bg-cyan-700 hover:bg-cyan-800 text-neutral-100"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => handleEditClick(item)}
                className="btn btn-secondary mt-4 bg-neutral-400 hover:bg-neutral-500 text-cyan-700"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BacklogList;
