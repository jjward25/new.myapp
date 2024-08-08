// src/utils/taskDataProcessor.js

export function processTaskData(tasks) {
    const completedTasks = {};
    const missedTasks = {};
  
    tasks.forEach(task => {
      const dueDate = task['Due Date'];
      const completeDate = task['Complete Date'];
  
      // Convert dates to Date objects
      const dueDateObj = new Date(dueDate);
      const completeDateObj = completeDate ? new Date(completeDate) : null;
  
      // Add to completed tasks
      if (completeDateObj) {
        const completeDateStr = completeDateObj.toISOString().split('T')[0];
        completedTasks[completeDateStr] = (completedTasks[completeDateStr] || 0) + 1;
      }
  
      // Add to missed tasks
      if (!completeDateObj && dueDateObj < new Date()) {
        const dueDateStr = dueDateObj.toISOString().split('T')[0];
        missedTasks[dueDateStr] = (missedTasks[dueDateStr] || 0) + 1;
      }
    });
  
    return {
      completed: completedTasks,
      missed: missedTasks
    };
  }
  