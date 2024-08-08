// src/utils/taskDataProcessor.js

export function processTaskData(tasks) {
  const completedTasks = {};
  const missedTasks = {};

  const today = new Date();

  tasks.forEach(task => {
      const dueDate = task['Due Date'];
      const completeDate = task['Complete Date'];

      // Convert dates to Date objects
      const dueDateObj = new Date(dueDate);
      const completeDateObj = completeDate ? new Date(completeDate) : null;

      // Skip tasks with Due Dates greater than today
      if (dueDateObj > today) {
          return;
      }

      // Add to completed tasks
      if (completeDateObj && dueDateObj <= today) {
          const completeDateStr = completeDateObj.toISOString().split('T')[0];
          completedTasks[completeDateStr] = (completedTasks[completeDateStr] || 0) + 1;
      }

      // Add to missed tasks
      if (!completeDateObj && dueDateObj <= today) {
          const dueDateStr = dueDateObj.toISOString().split('T')[0];
          missedTasks[dueDateStr] = (missedTasks[dueDateStr] || 0) + 1;
      }

      // Log the entire objects
      console.log("Completed Tasks:", completedTasks);
      console.log("Missed Tasks:", missedTasks);
  });

  return {
      completed: completedTasks,
      missed: missedTasks,
  };
}
