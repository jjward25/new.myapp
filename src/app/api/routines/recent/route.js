// src/app/api/routines/recent.js

import { getMostRecentRoutine } from '../../../../utils/mongoDB/routinesCRUD';

// Example of Cache-Control header configuration
export async function GET(req) {
  try {
    const routine = await getMostRecentRoutine();
    return new Response(JSON.stringify(routine), {
      status: 200,
      headers: {
      },
    });
  } catch (error) {
    console.error('Error fetching most recent routine:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch most recent routine' }), {
      status: 500,
      headers: {
      },
    });
  }
}
