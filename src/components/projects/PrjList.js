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

  const handleToggleSortOrder = (order) => {
    if (order === 'date') {
      setDateOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
      setSortOrder('date');
    } else {
      setPriorityOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
      setSortOrder('priority');
    }
  };

  const sortMilestones = (milestones) => {
    if (sortOrder === 'date') {
      return milestones.sort((a, b) => {
        const dateA = new Date(a["Start Date"]);
        const dateB = new Date(b["Start Date"]);
        return dateOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    return milestones.sort((a, b) => priorityOrder === 'asc' ? a["Milestone Priority"] - b["Milestone Priority"] : b["Milestone Priority"] - a["Milestone Priority"]);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto md:px-0 h-0 md:h-auto">
      <div className="flex space-x-5 mb-8 border-t border-b border-neutral-500 py-2 w-full justify-evenly">
        <button
          onClick={() => handleToggleSortOrder('date')}
          className="btn btn-sm btn-outline btn-default text-neutral-500 hover:text-neutral-400 hover:underline"
        >
          Start Date {sortOrder === 'date' && dateOrder === 'asc' ? 'Descending' : 'Ascending'}
        </button>
        <button
          onClick={() => handleToggleSortOrder('priority')}
          className="btn btn-sm btn-outline btn-default text-neutral-500 hover:text-neutral-400 hover:underline"
        >
          Priority {sortOrder === 'priority' && priorityOrder === 'asc' ? 'Descending' : 'Ascending'}
        </button>
      </div>
      {sortedProjects.map(({ projectName, projectPriority, milestones }) => {
        // Sort milestones based on selected criteria
        const sortedMilestones = sortMilestones(milestones);

        // Determine the number of milestones to display
        const shouldShowMore = sortedMilestones.length > 4;
        const shownMilestones = visibleProjects[projectName]
          ? sortedMilestones
          : sortedMilestones.slice(0, 4);

        return (
          <div key={projectName} className="mb-6">
            <h1 className="text-xl md:text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">
              {projectName}
            </h1>
            <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px] mb-3"></div>

            <div className="flex flex-row flex-wrap space-4">
              {/* Render the milestones */}
              {shownMilestones.map((milestone, index) => (
                <div key={index} className="w-full">
                  <h2 className="text-lg font-semibold mb-2">{milestone.milestoneName}</h2>
                  <div className="flex flex-row flex-wrap space-4">
                    <PrjCard key={index} milestone={milestone} />
                  </div>
                </div>
              ))}
            </div>

            {/* Conditionally render "See more" button */}
            {shouldShowMore && (
              <button
                onClick={() => handleToggleVisibility(projectName)}
                className="text-neutral-500 hover:text-neutral-400 mt-4 hover:underline"
              >
                {visibleProjects[projectName] ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PrjList;
