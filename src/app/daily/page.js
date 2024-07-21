// src/app/page.js
import React from 'react';
import fs from 'fs';
import path from 'path';
import TaskCard from '../backlog/components/TaskCard';

const Tasks = async () => {
  const filePath = path.join(process.cwd(), 'src/utils/jsons/daily.json');
  const jsonData = fs.readFileSync(filePath, 'utf8');
  const tasks = JSON.parse(jsonData);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task, index) => (
          <TaskCard key={index} task={task} />
        ))}
      </div>
    </div>
  );
};

export default Tasks;
