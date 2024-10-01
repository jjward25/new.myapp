// src/component/d3/TaskTrendData.js

export function processTaskData(tasks) {
    const completedTasks = {};
    const missedTasks = {};
  
    const today = new Date();
    const todayStr = normalizeDate(today); // Normalize today's date
  
    tasks.forEach(task => {
      // Filter tasks to only include those where Type is 'Task'
      if (task.Type !== 'Task') {
        return; // Skip this task if Type is not 'Task'
      }
  
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
        const completeDateStr = normalizeDate(completeDateObj);
        completedTasks[completeDateStr] = (completedTasks[completeDateStr] || 0) + 1;
      }
  
      // Add to missed tasks
      if (!completeDateObj && dueDateObj <= today) {
        const dueDateStr = normalizeDate(dueDateObj);
        missedTasks[dueDateStr] = (missedTasks[dueDateStr] || 0) + 1;
      }
    });
  
    // Ensure today's data is included
    completedTasks[todayStr] = completedTasks[todayStr] || 0;
    missedTasks[todayStr] = missedTasks[todayStr] || 0;
  
    return {
      completed: completedTasks,
      missed: missedTasks,
    };
  }
  
  // Function to normalize date
  const normalizeDate = (date) => {
    const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    return estDate.toISOString().split('T')[0];
  };
  