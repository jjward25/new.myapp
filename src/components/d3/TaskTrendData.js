// src/component/d3/TaskTrendData.js

export const normalizeDate = (dateStr) => {
  const date = new Date(dateStr);
  const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return `${estDate.getFullYear()}-${String(estDate.getMonth() + 1).padStart(2, '0')}-${String(estDate.getDate()).padStart(2, '0')}`;
};

export const processTaskData = (tasks) => {
  const completedTasks = {};
  const missedTasks = {};

  tasks.forEach(task => {
    const dueDate = normalizeDate(task['Due Date']);
    
    if (task['Status'] === 'Completed') {
      completedTasks[dueDate] = (completedTasks[dueDate] || 0) + 1;
    } else {
      missedTasks[dueDate] = (missedTasks[dueDate] || 0) + 1;
    }
  });

  return {
    completed: completedTasks,
    missed: missedTasks,
  };
};
