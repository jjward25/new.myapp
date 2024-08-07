// src/utils/PrjReformat.js
import { GET } from '../app/api/projects/route'; // Adjust the import path as needed

export async function fetchAndReformatData() {
  try {
    // Fetch the data from the API
    const response = await GET();
    const data = await response.json();
    
    // Check if the data fetch was successful
    if (response.status !== 200) {
      throw new Error('Failed to fetch data');
    }

    // Reformat the data
    const reformattedData = data.map(project => {
      const projectName = project["Project Name"];
      const projectPriority = project["Project Priority"];
      const projectType = project["Type"];
      const projectNotes = project["Notes"];

      // Flatten milestones
      const milestones = Object.entries(project.Milestones).map(([milestoneName, milestone]) => ({
        ProjectName: projectName,
        ProjectPriority: projectPriority,
        ProjectType: projectType,
        ProjectNotes: projectNotes,
        MilestoneName: milestoneName,
        MilestonePriority: milestone["Milestone Priority"],
        StartDate: milestone["Start Date"],
        DueDate: milestone["Due Date"],
        CompleteDate: milestone["Complete Date"],
        EstimatedSize: milestone["Estimated Size"],
        ActualHours: milestone["Actual Hours"],
        Notes: milestone["Notes"],
        Target: milestone["Target"],
        Actual: milestone["Actual"]
      }));

      return milestones;
    }).flat(); // Flatten the array of arrays

    console.log(reformattedData)

    return reformattedData;
  } catch (error) {
    console.error('Error fetching and reformatting data:', error);
    throw error;
  }
}
