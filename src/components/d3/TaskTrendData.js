export const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.error("Invalid date:", dateStr);
    return null;
  }
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};

export const processTaskData = (tasks) => {
  console.log('Input Tasks:', tasks);

  const completedTasks = {};
  const missedTasks = {};

  tasks.forEach(task => {
    const dueDate = normalizeDate(task['Due Date']);

    if (task['Complete Date']) {
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


