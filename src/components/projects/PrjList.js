// src/components/PrjList.js
'use client'; // Ensure this component runs in the client
import React, { useState, useEffect } from 'react';
import MilestoneCard from './MilestoneCard';

const PrjList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        const transformedProjects = data.map((project) => ({
          _id: project._id, // Ensure _id is included
          projectName: project["Project Name"],
          projectPriority: project["Project Priority"],
          milestones: Object.entries(project.Milestones).map(([milestoneName, milestone]) => ({
            ...milestone,
            milestoneName,
          })),
        }));
  
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

  const handleDeleteMilestone = async (milestone) => {
    try {
      // Find the project containing the milestone
      const project = projects.find(p => p.milestones.some(m => m.milestoneName === milestone.milestoneName));
  
      if (!project) {
        throw new Error('Project not found');
      }
  
      const projectId = project._id.toString(); // Ensure _id is a string
  
      console.log(`Deleting milestone from project: ${projectId}, milestone: ${milestone.milestoneName}`);
  
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          milestoneName: milestone.milestoneName
        }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      // Update the projects state after deletion
      const updatedProjects = projects.map((proj) => {
        if (proj._id.toString() === projectId) {
          const newMilestones = proj.milestones.filter(m => m.milestoneName !== milestone.milestoneName);
          return { ...proj, milestones: newMilestones };
        }
        return proj;
      });
  
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error deleting milestone:', error);
      setError('Unable to delete milestone');
    }
  };
  
  const handleDeleteProject = async (projectName) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectName }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const updatedProjects = projects.filter((project) => project.projectName !== projectName);
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Unable to delete project');
    }
  };
  

  const handleAddMilestone = async (projectName) => {
    const milestoneName = prompt("Enter the new milestone name:");
    if (milestoneName) {
      const milestonePriority = prompt("Enter the milestone priority:");
      const startDate = prompt("Enter the start date:");
      const dueDate = prompt("Enter the due date:");
      const completeDate = prompt("Enter the complete date:");
      const estimatedSize = prompt("Enter the estimated size:");
      const actualHours = prompt("Enter the actual hours:");
      const notes = prompt("Enter notes:");
      const target = prompt("Enter the target:");
      const actual = prompt("Enter the actual:");

      const newMilestone = {
        milestoneName,
        "Milestone Priority": milestonePriority || null,
        "Start Date": startDate || null,
        "Due Date": dueDate || null,
        "Complete Date": completeDate || null,
        "Estimated Size": estimatedSize || null,
        "Actual Hours": actualHours || null,
        Notes: notes || null,
        Target: target || null,
        Actual: actual || null,
      };

      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectName, milestone: newMilestone }),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const updatedProjects = projects.map((project) => {
          if (project.projectName === projectName) {
            return {
              ...project,
              milestones: [
                ...project.milestones,
                { ...newMilestone, milestoneName }
              ],
            };
          }
          return project;
        });

        setProjects(updatedProjects);
      } catch (error) {
        console.error('Error adding milestone:', error);
        setError('Unable to add milestone');
      }
    }
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

  const sortedProjects = projects.sort((a, b) => b.projectPriority - a.projectPriority);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto md:px-0 md:h-auto">
      {sortedProjects.map(({ projectName, projectPriority, milestones }) => {
        const sortedMilestones = sortMilestones(milestones);

        return (
          <div key={projectName} className="flex flex-col mb-6 max-w-[750px] mx-auto w-full h-full">
            <div className="flex justify-between items-center">
              <h1 className="text-xl md:text-3xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 via-neutral-400 to-cyan-700">
                {projectName}
              </h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDeleteProject(projectName)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg"
                >
                  Delete Project
                </button>
                <button
                  onClick={() => handleAddMilestone(projectName)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg"
                >
                  Add Milestone
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-900 to-purple-300 h-[2px] mb-3"></div>

            <div className="flex flex-row w-auto justify-start overflow-auto space-0 disable-scrollbars">
              {sortedMilestones.map((milestone, index) => (
                <div key={index} className="flex flex-col w-full max-w-[350px] mr-6 mb-4 h-full">
                  <div className="flex flex-row flex-wrap space-4 h-full">
                    <MilestoneCard 
                      key={index} 
                      milestone={milestone} 
                      handleDeleteMilestone={() => handleDeleteMilestone(milestone)} 
                    />
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
