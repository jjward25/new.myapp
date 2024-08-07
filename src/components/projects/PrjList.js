// src/components/MilestonesPage.js
'use client'; // Ensure this component runs in the client
import React, { useState, useEffect } from 'react';
import PrjCard from './PrjCard';

const PrjList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleProjects, setVisibleProjects] = useState({});
  const [sortOrder, setSortOrder] = useState('priority'); // 'priority' or 'date'
  const [dateOrder, setDateOrder] = useState('asc'); // 'asc' or 'desc'
  const [priorityOrder, setPriorityOrder] = useState('asc'); // 'asc' or 'desc'

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        console.log('Fetched Data:', data); // Debugging line

        // Transform data into the expected format
        const transformedProjects = data[0].Projects.map((project) => {
          return {
            projectName: project["Project Name"],
            projectPriority: project["Project Priority"],
            milestones: Object.entries(project.Milestones).map(([milestoneName, milestone]) => ({
              ...milestone,
              milestoneName,
            })),
          };
        });

        setProjects(transformedProjects);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Unable to fetch projects');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Sort projects by Project Priority
  const sortedProjects = projects.sort((a, b) => b.projectPriority - a.projectPriority);

  const handleToggleVisibility = (projectName) => {
    setVisibleProjects((prev) => ({
      ...prev,
      [projectName]: !prev[projectName],
    }));
  };


  const sortMilestones = (milestones) => {
    if (sortOrder === 'date') {
      return milestones.sort((a, b) => {
        const dateA = new Date(a["Due Date"]);
        const dateB = new Date(b["Due Date"]);
        return dateOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    return milestones.sort((a, b) => priorityOrder === 'asc' ? a["Milestone Priority"] - b["Milestone Priority"] : b["Milestone Priority"] - a["Milestone Priority"]);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto md:px-0 md:h-auto">
     
      {sortedProjects.map(({ projectName, projectPriority, milestones }) => {
        // Sort milestones based on selected criteria
        const sortedMilestones = sortMilestones(milestones);

        return (
          <div key={projectName} className="flex flex-col mb-6 max-w-[750px] mx-auto w-full h-full">
            <h1 className="text-xl md:text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">
              {projectName}
            </h1>
            <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px] mb-3"></div>

            <div className="flex flex-row w-auto justify-start overflow-auto space-0 disable-scrollbars">

              {/* Render the milestones */}
              {sortedMilestones.map((milestone, index) => (
                <div key={index} className="flex flex-col w-full max-w-[350px] mr-6 mb-4 h-full">                 
                  <div className="flex flex-row flex-wrap space-4 h-full">
                    <PrjCard key={index} milestone={milestone} />
                  </div>
                </div>
              ))}

            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrjList;
