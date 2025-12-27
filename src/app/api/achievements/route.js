// src/app/api/achievements/route.js
import { NextResponse } from 'next/server';
import { 
  getAchievementLevels, 
  incrementProjectsLevel, 
  incrementRoutinesLevel, 
  incrementWorkoutsLevel,
  checkAndMarkWeeklyWorkout
} from '@/utils/mongoDB/achievementsCRUD';

// GET - Fetch current achievement levels
export async function GET() {
  try {
    const levels = await getAchievementLevels();
    return NextResponse.json(levels);
  } catch (error) {
    console.error('Error fetching achievement levels:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

// POST - Increment a level
export async function POST(request) {
  try {
    const body = await request.json();
    const { pool, weekIdentifier } = body;
    
    let newLevel;
    
    switch (pool) {
      case 'projects':
        newLevel = await incrementProjectsLevel();
        break;
      case 'routines':
        newLevel = await incrementRoutinesLevel();
        break;
      case 'workouts':
        newLevel = await incrementWorkoutsLevel();
        break;
      case 'weeklyWorkout':
        // Special case for weekly workout - prevents double counting
        const result = await checkAndMarkWeeklyWorkout(weekIdentifier);
        return NextResponse.json(result);
      default:
        return NextResponse.json({ error: 'Invalid pool' }, { status: 400 });
    }
    
    return NextResponse.json({ level: newLevel });
  } catch (error) {
    console.error('Error incrementing achievement level:', error);
    return NextResponse.json({ error: 'Failed to increment level' }, { status: 500 });
  }
}

