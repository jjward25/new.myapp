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
  
      console.log("Raw API Data:", data); // Log full API response
  
      // Filter projects where "Project Complete Date" is null
      const filteredProjects = data.filter(project => !project["Project Complete Date"]);
      console.log("Filtered Projects:", filteredProjects);
  
      // Extract milestones and group them under each project
      const allMilestones = filteredProjects.flatMap((project) =>
        Object.entries(project.Milestones || {}).map(([milestoneName, milestone]) => ({
          ...milestone,
          milestoneName,
          projectName: project["Project Name"],
        }))
      );
      console.log("All Milestones:", allMilestones);
  
      // Filter milestones with priority 0 and incomplete status
      const milestonesWithPriorityZero = allMilestones.filter(milestone => {
        const priorityZero = Number(milestone["Milestone Priority"]) === 0;
        const isCompleteDateNullOrEmpty = !milestone["Complete Date"] || milestone["Complete Date"] === "";
        return priorityZero && isCompleteDateNullOrEmpty;
      });
      console.log("Milestones With P0:", milestonesWithPriorityZero);
  
      // Group milestones by project name
      const grouped = milestonesWithPriorityZero.reduce<{ [key: string]: Milestone[] }>((acc, milestone) => {
        if (!acc[milestone.projectName]) {
          acc[milestone.projectName] = [];
        }
        acc[milestone.projectName].push(milestone);
        return acc;
      }, {});
      console.log("Grouped Milestones:", grouped);
  
      // Ensure only projects with at least one milestone appear
      const sortedProjects = filteredProjects
        .filter(project => grouped[project["Project Name"]] && grouped[project["Project Name"]].length > 0)
        .sort((a, b) => a["Project Priority"] - b["Project Priority"]);
  
      console.log("Sorted Projects:", sortedProjects);
  
      setGroupedMilestones(grouped);
      setSortedProjects(sortedProjects);
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className='flex flex-col w-full justify-start mb-2 rounded-md h-fit'>
      <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} cursor-pointer relative w-full overflow-hidden h-full`} onClick={toggleAccordion}>
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} absolute -inset-3 bg-cyan-700 blur opacity-20`}></div>
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} relative flex justify-between px-1 py-1 border-2 border-cyan-800 text-cyan-950 dark:text-cyan-500 hover:text-cyan-600`}>
          <p className='text-lg font-semibold pl-1 my-0 text-white opacity-90'>Project P0s</p>
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
              <p>No milestones with Priority 0 found.</p>
            ) : (
              sortedProjects.map((project) => {
                const milestones = groupedMilestones[project["Project Name"]] || [];
                return (
                  <div key={project.id} className='mb-1'>
                   <h3 className="text-lg font-bold mb-1 bg-gradient-to-r from-cyan-600 to-blue-400 bg-clip-text text-transparent">
                    {project["Project Name"]}
                  </h3>
                    {milestones.length > 0 ? (
                      milestones.map((milestone, index) => (
                        <MilestoneCard key={index} milestone={milestone} />
                      ))
                    ) : (
                      <p className='text-sm text-gray-500'>No milestones for this project.</p>
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
