// src/components/MilestonesPage.js
'use client'; // Ensure this component runs in the client
import React, { useState } from 'react';
import PrjCard from './PrjCard';

const PrjList = ({ milestones }) => {
  // Group milestones by project and sort projects by Project Priority
  const projects = milestones.reduce((acc, milestone) => {
    if (!milestone || !milestone.Project || milestone["Project Priority"] === undefined) {
      console.warn('Skipping invalid milestone:', milestone);
      return acc;
    }

    const { Project, "Project Priority": projectPriority } = milestone;
    if (!acc[Project]) {
      acc[Project] = { projectPriority, milestones: [] };
    }
    acc[Project].milestones.push(milestone);

    return acc;
  }, {});

  // Convert to an array and sort by Project Priority
  const sortedProjects = Object.entries(projects)
    .sort((b, a) => b[1].projectPriority - a[1].projectPriority);

  const [visibleProjects, setVisibleProjects] = useState({});
  const [sortOrder, setSortOrder] = useState('priority'); // 'priority' or 'date'
  const [dateOrder, setDateOrder] = useState('asc'); // 'asc' or 'desc'
  const [priorityOrder, setPriorityOrder] = useState('asc'); // 'asc' or 'desc'

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
    return milestones.sort((a, b) => priorityOrder === 'asc' ? a.Priority - b.Priority : b.Priority - a.Priority);
  };

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
      {sortedProjects.map(([projectName, { projectPriority, milestones }]) => {
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
                <PrjCard key={index} milestone={milestone} />
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
