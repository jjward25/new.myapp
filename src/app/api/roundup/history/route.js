// src/app/api/roundup/history/route.js
//
// Last N days of the same digest /api/roundup serves the latest of -- used
// by /morning-review to flag a source that's returned nothing for several
// days straight (a real, confirmed-live news_roundup fetch failure, not
// normal "no new items since last check" behavior; see roadmap.md). Same
// direct Mongo read pattern, just more than one doc.
import { getRecentDailyRoundups } from '../../../../utils/mongoDB/dailyRoundupCRUD';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(14, Math.max(1, Number(searchParams.get('days')) || 3));
    const roundups = await getRecentDailyRoundups(days);
    return new Response(JSON.stringify({ roundups }), { status: 200 });
  } catch (error) {
    console.error('Error fetching daily roundup history:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch daily roundup history' }), { status: 500 });
  }
}
