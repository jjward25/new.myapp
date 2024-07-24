"use client";

import React, { useState } from 'react';
import AddNewTaskForm from './backlog/NewTaskButton';
import BacklogListShort from './backlog/BacklogListShort';

const ClientWrapper = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTaskAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex flex-col w-full h-full justify-start">
          <AddNewTaskForm onTaskAdded={handleTaskAdded} />
          <BacklogListShort refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default ClientWrapper;
