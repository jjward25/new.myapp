// src/app/api/kpis/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/utils/mongoDB/mongoConnect';

// Helper to get week boundaries (Monday to Sunday)
function getWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  
  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// Format date as YYYY-MM-DD for comparison
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');
    
    const now = new Date();
    const thisWeek = getWeekBounds(now);
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeek = getWeekBounds(lastWeekDate);
    
    // 1. P0 Milestones Completed
    const projects = await db.collection('Projects').find({}).toArray();
    
    let p0ThisWeek = 0;
    let p0LastWeek = 0;
    
    projects.forEach((project) => {
      const milestones = project.Milestones || {};
      Object.values(milestones).forEach((milestone) => {
        if (Number(milestone['Milestone Priority']) === 0 && milestone['Complete Date']) {
          const completeDate = new Date(milestone['Complete Date']);
          if (completeDate >= thisWeek.start && completeDate <= thisWeek.end) {
            p0ThisWeek++;
          } else if (completeDate >= lastWeek.start && completeDate <= lastWeek.end) {
            p0LastWeek++;
          }
        }
      });
    });
    
    // 2. Cardio Miles from Simple Workouts
    const workoutData = await db.collection('Workouts').find({}).toArray();
    const allWorkouts = workoutData[0]?.Workouts || [];
    const simpleWorkouts = allWorkouts.filter((w) => w.Type === 'simple');
    
    let milesThisWeek = 0;
    let milesLastWeek = 0;
    
    const thisWeekStartStr = formatDate(thisWeek.start);
    const thisWeekEndStr = formatDate(thisWeek.end);
    const lastWeekStartStr = formatDate(lastWeek.start);
    const lastWeekEndStr = formatDate(lastWeek.end);
    
    simpleWorkouts.forEach((workout) => {
      const workoutDate = workout.Date;
      const exercises = workout.Exercises || [];
      
      exercises.forEach((ex) => {
        if (ex.Category === 'Cardio' && ex.Miles) {
          if (workoutDate >= thisWeekStartStr && workoutDate <= thisWeekEndStr) {
            milesThisWeek += Number(ex.Miles) || 0;
          } else if (workoutDate >= lastWeekStartStr && workoutDate <= lastWeekEndStr) {
            milesLastWeek += Number(ex.Miles) || 0;
          }
        }
      });
    });
    
    // 3. Events This Week
    const events = await db.collection('Calendar').find({}).toArray();
    
    let eventsThisWeek = 0;
    
    events.forEach((event) => {
      const eventDate = event.date;
      if (eventDate && eventDate >= thisWeekStartStr && eventDate <= thisWeekEndStr) {
        eventsThisWeek++;
      }
    });
    
    // 4. Open Tasks Count
    const tasks = await db.collection('Backlog').find({}).toArray();
    
    const openTasks = tasks.filter((task) => {
      const hasNoCompleteDate = !task['Complete Date'];
      const isNotMissed = task.Missed !== true;
      return hasNoCompleteDate && isNotMissed;
    }).length;
    
    return NextResponse.json({
      p0Completed: {
        thisWeek: p0ThisWeek,
        lastWeek: p0LastWeek
      },
      cardioMiles: {
        thisWeek: milesThisWeek,
        lastWeek: milesLastWeek,
        goal: 6
      },
      eventsThisWeek,
      openTasks
    });
    
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
  }
}

