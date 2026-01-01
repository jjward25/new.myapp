// src/app/api/kpis/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/utils/mongoDB/mongoConnect';
import { getWeekBoundsEST, formatDateEST, getNowEST } from '@/utils/dateUtils';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('Personal');
    
    // Get current time in EST
    const nowEST = getNowEST();
    const thisWeek = getWeekBoundsEST(nowEST);
    
    // Get last week bounds
    const lastWeekDate = new Date(nowEST);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeek = getWeekBoundsEST(lastWeekDate);
    
    // Week bounds as strings for comparison
    const thisWeekStartStr = thisWeek.start;
    const thisWeekEndStr = thisWeek.end;
    const lastWeekStartStr = lastWeek.start;
    const lastWeekEndStr = lastWeek.end;
    
    // 1. P0 Milestones Completed
    const projects = await db.collection('Projects').find({}).toArray();
    
    let p0ThisWeek = 0;
    let p0LastWeek = 0;
    
    projects.forEach((project) => {
      const milestones = project.Milestones || {};
      Object.values(milestones).forEach((milestone) => {
        if (Number(milestone['Milestone Priority']) === 0 && milestone['Complete Date']) {
          const completeDateStr = milestone['Complete Date']; // Already stored as YYYY-MM-DD
          if (completeDateStr >= thisWeekStartStr && completeDateStr <= thisWeekEndStr) {
            p0ThisWeek++;
          } else if (completeDateStr >= lastWeekStartStr && completeDateStr <= lastWeekEndStr) {
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
    
    simpleWorkouts.forEach((workout) => {
      const workoutDate = workout.Date; // Already stored as YYYY-MM-DD
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
      const eventDate = event.date; // Already stored as YYYY-MM-DD
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
