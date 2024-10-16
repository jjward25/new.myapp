'use client'; // Ensure this component runs in the client
import React, { useEffect, useState } from 'react';
import MilestoneCard from './MilestoneHomeCard';

// Define interfaces for Project and Milestone
interface Milestone {
  id: number; // Assuming there's an id, adjust as necessary
  milestoneName: string;
  "Milestone Priority": string; // This might need to be changed based on your API response
  "Complete Date": string | null; // Add this line to include Complete Date
}

interface Project {
  id: number; // Assuming there's an id, adjust as necessary
  Milestones: { [key: string]: Milestone }; // Mapping of milestone name to Milestone object
}

const MilestoneList: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); // State for accordion toggle

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: Project[] = await response.json(); // Explicitly define the type of data

      const allMilestones = data.flatMap((project: Project) => 
        Object.entries(project.Milestones).map(([milestoneName, milestone]) => ({
          ...milestone,
          milestoneName,
        }))
      );

      const milestonesWithPriorityZero = allMilestones.filter(milestone => {
            const priorityZero = parseInt(milestone["Milestone Priority"], 10) === 0;
            const isCompleteDateNullOrEmpty = milestone["Complete Date"] === null || milestone["Complete Date"] === ""; // Check if Complete Date is null or empty
            return priorityZero && isCompleteDateNullOrEmpty; // Filter both conditions
        });

      setMilestones(milestonesWithPriorityZero);
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
    <div className='flex flex-col w-full justify-start mb-2 rounded-md'>
      <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} cursor-pointer relative w-full overflow-hidden h-full`} onClick={toggleAccordion}>
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} absolute -inset-3 bg-cyan-700 blur opacity-20`}></div>
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} relative flex justify-between px-1 py-1 border-2 border-cyan-800 text-cyan-950 dark:text-cyan-500 hover:text-cyan-600`}>
          <p className='text-lg font-semibold pl-1 my-0'>P0 Milestones</p>
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
          <div className='mt-4 w-full px-2'>
            {milestones.length === 0 ? (
              <p>No milestones with Priority 0 found.</p>
            ) : (
              milestones.map((milestone, index) => (
                <MilestoneCard key={index} milestone={milestone} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneList;
