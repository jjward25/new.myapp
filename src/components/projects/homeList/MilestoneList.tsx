'use client';
import React, { useEffect, useState } from 'react';
import MilestoneCard from './MilestoneHomeCard';

// Define interfaces for Project and Milestone
interface Milestone {
  id: number;
  milestoneName: string;
  "Milestone Priority": string;
  "Complete Date": string | null;
  projectName: string;
  Notes?: string;
}

interface Project {
  id: number;
  "Project Name": string;
  "Project Priority": number;
  "Project Complete Date": string | null;
  Milestones: { [key: string]: Milestone };
}

const MilestoneList: React.FC = () => {
  const [groupedMilestones, setGroupedMilestones] = useState<{ [key: string]: Milestone[] }>({});
  const [sortedProjects, setSortedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  // Track which project accordions are expanded (project name -> boolean)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: Project[] = await response.json();
  
      // Filter projects where "Project Complete Date" is null
      const filteredProjects = data.filter(project => !project["Project Complete Date"]);
  
      // Extract ALL open milestones (not just P0) and group them under each project
      const allMilestones = filteredProjects.flatMap((project) =>
        Object.entries(project.Milestones || {}).map(([milestoneName, milestone]) => ({
          ...milestone,
          milestoneName,
          projectName: project["Project Name"],
        }))
      );
  
      // Filter milestones that are incomplete (no Complete Date)
      const openMilestones = allMilestones.filter(milestone => {
        const isCompleteDateNullOrEmpty = !milestone["Complete Date"] || milestone["Complete Date"] === "";
        return isCompleteDateNullOrEmpty;
      });
  
      // Group milestones by project name
      const grouped = openMilestones.reduce<{ [key: string]: Milestone[] }>((acc, milestone) => {
        if (!acc[milestone.projectName]) {
          acc[milestone.projectName] = [];
        }
        acc[milestone.projectName].push(milestone);
        return acc;
      }, {});
  
      // Sort milestones within each project by priority (P0 first)
      Object.keys(grouped).forEach(projectName => {
        grouped[projectName].sort((a, b) => {
          const priorityA = Number(a["Milestone Priority"]) || 999;
          const priorityB = Number(b["Milestone Priority"]) || 999;
          return priorityA - priorityB;
        });
      });
  
      // Ensure only projects with at least one open milestone appear
      const projectsWithMilestones = filteredProjects
        .filter(project => grouped[project["Project Name"]] && grouped[project["Project Name"]].length > 0)
        .sort((a, b) => a["Project Priority"] - b["Project Priority"]);
  
      // Initialize expanded state: first project expanded, rest collapsed
      const initialExpanded: Record<string, boolean> = {};
      projectsWithMilestones.forEach((project, index) => {
        initialExpanded[project["Project Name"]] = index === 0;
      });
  
      setGroupedMilestones(grouped);
      setSortedProjects(projectsWithMilestones);
      setExpandedProjects(initialExpanded);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      setError('Unable to fetch milestones');
      setLoading(false);
    }
  };

  const toggleAccordion = () => {
    setIsOpen(prev => !prev);
  };

  const toggleProjectAccordion = (projectName: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectName]: !prev[projectName]
    }));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className='flex flex-col w-full justify-start mb-2 rounded-md h-fit'>
      <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} cursor-pointer relative w-full overflow-hidden h-full`} onClick={toggleAccordion}>
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} absolute -inset-3 bg-cyan-700 blur opacity-20`}></div>
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} relative flex justify-between px-1 py-1 border-2 border-cyan-800 text-cyan-950 dark:text-cyan-500 hover:text-cyan-600`}>
          <p className='text-lg font-semibold pl-1 my-0 text-white opacity-90'>Open Milestones</p>
          <svg
            className={`w-6 h-6 mt-1 transition-transform duration-300 transform rotate-180 ${isOpen ? 'transform rotate-2' : ''}`}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" className={`fill-cyan-950`} />
            <path d="M8 12l4 4 4-4" className="stroke-current text-cyan-200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className={`px-0 ${isOpen ? 'bg-neutral-200 rounded-br-lg rounded-bl-lg pb-3 border-2 border-t-0 border-cyan-700 flex justify-center' : ''}`}>
        {isOpen && (
          <div className='mt-2 w-full px-2'>
            {sortedProjects.length === 0 ? (
              <p className='text-gray-600'>No open milestones found.</p>
            ) : (
              sortedProjects.map((project) => {
                const milestones = groupedMilestones[project["Project Name"]] || [];
                const isExpanded = expandedProjects[project["Project Name"]] || false;
                
                return (
                  <div key={project.id} className='mb-2'>
                    {/* Project Accordion Header */}
                    <div 
                      className="flex items-center justify-between cursor-pointer bg-gradient-to-r from-cyan-800 to-cyan-700 px-3 py-2 rounded-lg hover:from-cyan-700 hover:to-cyan-600 transition-colors"
                      onClick={() => toggleProjectAccordion(project["Project Name"])}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">
                          {project["Project Name"]}
                        </h3>
                        <span className="bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {milestones.length}
                        </span>
                      </div>
                      <svg
                        className={`w-5 h-5 text-cyan-200 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                    
                    {/* Milestones Container */}
                    {isExpanded && (
                      <div className="mt-1 ml-2 space-y-1">
                        {milestones.map((milestone, index) => (
                          <div key={index} className="flex items-stretch gap-1">
                            <div className={`flex items-center justify-center text-xs font-semibold px-2 rounded-l-lg flex-shrink-0 ${
                              Number(milestone["Milestone Priority"]) === 0 
                                ? 'bg-red-500 text-white' 
                                : Number(milestone["Milestone Priority"]) === 1
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-400 text-white'
                            }`}>
                              P{milestone["Milestone Priority"]}
                            </div>
                            <MilestoneCard milestone={milestone} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneList;
