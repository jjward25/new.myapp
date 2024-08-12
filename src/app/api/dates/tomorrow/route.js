//src/app/api/dates/tomorrow/route.js
import { getTomorrow } from '../../../../utils/Date';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const tomorrow = await getTomorrow();
    return new Response(JSON.stringify({ tomorrow }), { status: 200 });
  } catch (error) {
    console.error('Error fetching tomorrow\'s date:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch tomorrow\'s date' }), { status: 500 })
  }
}