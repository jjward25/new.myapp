// src/app/api/routines/recent.js

import { getMostRecentRoutine } from '../../../../utils/mongoDB/routinesCRUD';

export async function GET(req) {
  try {
    const routine = await getMostRecentRoutine();
    return new Response(JSON.stringify(routine), { 
      status: 200,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } // Disable caching
    });
  } catch (error) {
    console.error('Error fetching most recent routine:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch most recent routine' }), { status: 500 });
  }
}
