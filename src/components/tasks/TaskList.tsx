'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskCard from './TaskCard';

interface Task {
  _id: string;
  "Complete Date": string | null;
  "Due Date": string;
  "Type": string;
  "Priority": string;
  "Session": string;
  [key: string]: any;
}

interface GenericListTemplateProps {
  sortOrder?: string;
  dateOrder?: string;
  priorityOrder?: string;
  dueDateFilter?: string;
  priorityFilter?: string[];
  typeFilter?: string[];
  completeDateFilter?: boolean | null;
  dueDateFromFilter?: string;
  dueDateBeforeFilter?: string;
  sessionFilter?: string[];
}

const GenericListTemplate: React.FC<GenericListTemplateProps> = ({
  sortOrder,
  dateOrder,
  priorityOrder,
  dueDateFilter,
  priorityFilter = [],
  typeFilter = [],
  completeDateFilter,
  dueDateFromFilter,
  dueDateBeforeFilter,
  sessionFilter = []
}) => {
  const [backlog, setBacklog] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBacklog = async () => {
      try {
        const response = await axios.get('/api/backlog');
        setBacklog(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBacklog();
  }, []);

  const handleEdit = (updatedItem: Task) => {
    setBacklog(prevBacklog =>
      prevBacklog.map(item => item._id === updatedItem._id ? updatedItem : item)
    );
  };

  const handleDelete = (id: string) => {
    setBacklog(prevBacklog =>
      prevBacklog.filter(item => item._id !== id)
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const filteredBacklog = backlog.filter(item => {
    const isCompleteDateMatch = completeDateFilter === null
      ? item["Complete Date"] === null
      : completeDateFilter === true
      ? item["Complete Date"] !== null
      : completeDateFilter === false
      ? item["Complete Date"] === null
      : true;

    const isDueDateMatch = dueDateFilter ? item["Due Date"] === dueDateFilter : true;
    const isDueDateFromMatch = dueDateFromFilter ? new Date(item["Due Date"]) >= new Date(dueDateFromFilter) : true;
    const isDueDateBeforeMatch = dueDateBeforeFilter ? new Date(item["Due Date"]) < new Date(dueDateBeforeFilter) : true;
    const isTypeMatch = typeFilter.length ? typeFilter.includes(item["Type"]) : true;
    const isPriorityMatch = priorityFilter.length ? priorityFilter.includes(item["Priority"]) : true;
    const isSessionMatch = sessionFilter.length ? sessionFilter.includes(item["Session"]) : true;

    return isCompleteDateMatch && isDueDateMatch && isTypeMatch && isDueDateFromMatch && isDueDateBeforeMatch && isPriorityMatch && isSessionMatch;
  });

  const priorityOrderMap: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const sortedBacklog = [...filteredBacklog];

  if (sortOrder === 'date') {
    sortedBacklog.sort((a, b) => {
      const dateA = new Date(a['Due Date']);
      const dateB = new Date(b['Due Date']);
      return dateOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
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

export default GenericListTemplate; 