// src/app/api/workouts/simple/route.js
import { 
  getSimpleWorkouts, 
  getTodaysSimpleWorkout, 
  addExerciseToWorkout, 
  deleteExercise 
} from '../../../../utils/mongoDB/simpleWorkoutCRUD';

export const dynamic = 'force-dynamic';

// GET - Fetch all simple workouts or today's workout
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    
    if (date) {
      const workout = await getTodaysSimpleWorkout(date);
      return new Response(JSON.stringify(workout), { status: 200 });
    }
    
    const workouts = await getSimpleWorkouts();
    return new Response(JSON.stringify(workouts), { status: 200 });
  } catch (error) {
    console.error('Error fetching simple workouts:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch workouts' }), { status: 500 });
  }
}

// POST - Add exercise to today's workout
export async function POST(req) {
  try {
    const body = await req.json();
    const { date, exercise } = body;
    
    if (!date || !exercise) {
      return new Response(JSON.stringify({ error: 'Date and exercise are required' }), { status: 400 });
    }
    
    const result = await addExerciseToWorkout(date, exercise);
    return new Response(JSON.stringify({ success: true, result }), { status: 201 });
  } catch (error) {
    console.error('Error adding exercise:', error);
    return new Response(JSON.stringify({ error: 'Failed to add exercise' }), { status: 500 });
  }
}

// DELETE - Remove exercise from workout
export async function DELETE(req) {
  try {
    const body = await req.json();
    const { date, exerciseId } = body;
    
    if (!date || !exerciseId) {
      return new Response(JSON.stringify({ error: 'Date and exerciseId are required' }), { status: 400 });
    }
    
    const result = await deleteExercise(date, exerciseId);
    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete exercise' }), { status: 500 });
  }
}

