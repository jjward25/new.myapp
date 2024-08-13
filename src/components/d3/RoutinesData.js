// src/components/d3/RoutinesData.js

export function processRoutinesData(routines) {
    const processedData = routines.map((routine) => {
        const { "Date": date, "Workout": workout, "Prof Dev": profDev, "Project Work": projectWork, "Spanish": spanish, "Piano": piano } = routine;
  
      return {
        Date,
        Workout: Workout ? 1 : 0,
        "Prof Dev": profDev ? 1 : 0,
        "Project Work": projectWork ? 1 : 0,
        Spanish: Spanish ? 1 : 0,
        Piano: Piano ? 1 : 0,
      };
    });
  
    // Group by date and sum the counts for each routine category
    const groupedData = processedData.reduce((acc, curr) => {
      const date = curr.Date;
      if (!acc[date]) {
        acc[date] = { Date: date, Workout: 0, "Prof Dev": 0, "Project Work": 0, Spanish: 0, Piano: 0 };
      }
      acc[date].Workout += curr.Workout;
      acc[date]["Prof Dev"] += curr["Prof Dev"];
      acc[date]["Project Work"] += curr["Project Work"];
      acc[date].Spanish += curr.Spanish;
      acc[date].Piano += curr.Piano;
  
      return acc;
    }, {});
  
    // Convert the grouped data back to an array
    return Object.values(groupedData);
  }
  