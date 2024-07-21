// src/components/MilestonesPage.js
'use client'; // Ensure this component runs in the client

import React, { useState } from 'react';
import PrjCard from './PrjCard';

const MilestonesPage = ({ milestones }) => {
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

  const handleToggleVisibility = (projectName) => {
    setVisibleProjects((prev) => ({
      ...prev,
      [projectName]: !prev[projectName],
    }));
  };

  return (
    <div className="container mx-auto p-4 md:px-0">
      {sortedProjects.map(([projectName, { projectPriority, milestones }]) => {
        // Sort milestones by Priority
        const sortedMilestones = milestones.sort((b, a) => b.Priority - a.Priority);

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

export default MilestonesPage;
