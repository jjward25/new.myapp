// src/pages/index.js

import React, { useEffect, useState } from 'react';
import MilestoneTrendChart from './MilestonesTrendChart';

const fetchData = async () => {
  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();

    const milestonesCompleted = [];

    projects.forEach(project => {
      Object.entries(project.Milestones).forEach(([milestoneName, milestoneDetails]) => {
        const completeDate = milestoneDetails['Complete Date'];
        if (completeDate) {
          const parsedDate = new Date(completeDate);
          milestonesCompleted.push({
            date: parsedDate,
            completed: 1 // Assuming each completed milestone is counted as 1
          });
        }
      });
    });

    return milestonesCompleted;
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};




const MilestoneTrendComponent = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData().then(data => {
      console.log('Transformed data:', data); // Check the format
      setData(data);
    });
  }, []);

  return (
    <div className="p-4 mx-auto">
      <h1 className="text-xl font-semibold text-fuchsia-600">Milestones Completed by Day</h1>
      <MilestoneTrendChart data={data} />
    </div>
  );
};

export default MilestoneTrendComponent;
