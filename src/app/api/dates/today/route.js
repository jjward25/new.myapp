//src/app/api/dates/today/route.js
import { getToday } from '../../../../utils/Date';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const today = await getToday();
    return new Response(JSON.stringify({ today }), { status: 200 });
  } catch (error) {
    console.error('Error fetching today\'s date:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch today\'s date' }), { status: 500 });
  }
}