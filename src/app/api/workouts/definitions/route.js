// src/app/api/workouts/definitions/route.js
// The workout selector: which workouts you can pick, and each one's
// prescribed exercises (from `workout_definitions`).
import { getDefinitions } from '../../../../utils/mongoDB/hermesWorkouts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return new Response(JSON.stringify(await getDefinitions()), { status: 200 });
  } catch (error) {
    console.error('Error fetching workout definitions:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch definitions' }), { status: 500 });
  }
}
