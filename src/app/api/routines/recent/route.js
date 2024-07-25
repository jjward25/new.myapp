// src/app/api/routines/recent/route.js

import { getMostRecentRoutine } from '../../../../utils/mongoDB/routinesCRUD';

// Forcing dynamic behavior by setting cache control headers
const cacheControlHeader = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

export async function GET(req) {
  try {
    const routine = await getMostRecentRoutine();
    return new Response(JSON.stringify(routine), {
      status: 200,
      headers: cacheControlHeader,
    });
  } catch (error) {
    console.error('Error fetching most recent routine:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch most recent routine' }), {
      status: 500,
      headers: cacheControlHeader,
    });
  }
}
