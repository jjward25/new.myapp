'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import TaskCard from './TaskCard';

const BacklogList = () => {
  const [backlog, setBacklog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleEdit = (updatedItem) => {
    setBacklog(backlog.map(item => item._id === updatedItem._id ? updatedItem : item));
  };

  const handleDelete = (id) => {
    setBacklog(backlog.filter(item => item._id !== id));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="w-full">
      {backlog.map(item => (
        <TaskCard
          key={item._id}
          task={item}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default BacklogList;
