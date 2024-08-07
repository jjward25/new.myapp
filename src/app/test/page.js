"use client"
import React, { useState, useEffect } from 'react';

const ProjectComponent = () => {
  const [projectId, setProjectId] = useState('66b2ec7f62eae320fecb0ed7'); // Set this to a real projectId

  const fetchAndLogProject = async (projectId) => {
    try {
      const response = await fetch(`/api/projects?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const project = await response.json();
      console.log('Fetched project data:', project); // Log the project data to the console
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  useEffect(() => {
    // Fetch and log data when the component mounts
    fetchAndLogProject(projectId);
  }, [projectId]);

  return (
    <div className='w-full h-100'>
      <button onClick={() => fetchAndLogProject(projectId)}>
        Fetch and Log Project
      </button>
    </div>
  );
};

export default ProjectComponent;
