'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import TaskCard from './TaskCard';

const BacklogList = ({ refreshTrigger, sortOrder, dateOrder, priorityOrder }) => {
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
  }, [refreshTrigger]);

  const handleEdit = (updatedItem) => {
    setBacklog(prevBacklog =>
      prevBacklog.map(item => item._id === updatedItem._id ? updatedItem : item)
    );
  };

  const handleDelete = (id) => {
    setBacklog(prevBacklog =>
      prevBacklog.filter(item => item._id !== id)
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const filteredBacklog = backlog.filter(item => item["Complete Date"] === null);

  return (
    <div className="w-full">
      {filteredBacklog.map(item => (
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
