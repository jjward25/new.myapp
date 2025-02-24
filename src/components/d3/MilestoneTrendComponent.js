"use client"
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
        const milestoneName2 = milestoneName
        if (completeDate) {
          const parsedDate = new Date(completeDate);
          const milestoneName = milestoneName2
          milestonesCompleted.push({
            date: parsedDate,
            name: milestoneName,
            completed: 1, // Assuming each completed milestone is counted as 1
            projectName: project['Project Name'] // Include the project name
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
      //console.log('Transformed data:', data); // Check the format
      setData(data);
    });
  }, []);

  return (
    <div className="p-4 mx-auto bg-gradient-to-tr from-black to-slate-800 rounded-lg w-full h-full">
      <h1 className="text-xl font-semibold text-cyan-800">Milestones Completed by Day</h1>
      <MilestoneTrendChart data={data} />
      <div id="tooltip" style={{
        position: 'absolute',
        background: 'white',
        border: '1px solid #ccc',
        padding: '5px',
        borderRadius: '3px',
        pointerEvents: 'none',
        display: 'none', // Start hidden
      }} />
    </div>
  );
};

export default MilestoneTrendComponent;
