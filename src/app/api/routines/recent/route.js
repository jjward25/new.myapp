// src/app/api/routines/recent.js
import { getMostRecentRoutine } from '../../../../utils/mongoDB/routinesCRUD';
import { revalidatePath } from 'next/cache';

// Ensure this route is treated as dynamic
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const routine = await getMostRecentRoutine();

    // Optionally revalidate the path if using ISR
    await revalidatePath('/api/routines/recent'); // Revalidate this specific path

    return new Response(JSON.stringify(routine), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching most recent routine:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch most recent routine' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  }
}
