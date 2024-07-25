'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import TaskCard from '../TaskCard';
import { getCurrentDate } from '../../Date';

const EventList = ({ refreshTrigger, sortOrder, dateOrder, priorityOrder }) => {
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

  const today = getCurrentDate();
  const filteredBacklog = backlog.filter(item => item["Due Date"] >= today && item["Complete Date"] === null && item["Type"] === "Event");

  // Define priority order mapping
  const priorityOrderMap = { P0: 0, P1: 1, P2: 2, P3: 3 };
  
  // Sort filteredBacklog
  const sortedBacklog = [...filteredBacklog];
  
  if (sortOrder === 'date') {
    sortedBacklog.sort((a, b) => {
      const dateA = new Date(a['Due Date']);
      const dateB = new Date(b['Due Date']);
      return dateOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  } else if (sortOrder === 'priority') {
    sortedBacklog.sort((a, b) => {
      const priorityA = priorityOrderMap[a['Priority']] ?? Infinity;
      const priorityB = priorityOrderMap[b['Priority']] ?? Infinity;
      return priorityOrder === 'asc' ? priorityA - priorityB : priorityB - priorityA;
    });
  }

  return (
    <div className="w-full">
      {sortedBacklog.map(item => (
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

export default EventList;
