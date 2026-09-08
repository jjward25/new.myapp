// src/app/api/roundup/route.js
//
// Serves the latest daily news-roundup + knowledge-graph digest, written by
// Hermes' local "Morning Roundup" cron job. Deliberately NOT a call through
// /api/hermes -- that goes through the live gateway and a fresh news_roundup
// run takes multiple minutes (well past what's practical for a synchronous
// webapp request even at Vercel Hobby's 300s ceiling). This is a direct,
// fast Mongo read of what the cron job already produced, same pattern as
// the workout/fitness_program routes.
import { getLatestDailyRoundup } from '../../../utils/mongoDB/dailyRoundupCRUD';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const roundup = await getLatestDailyRoundup();
    if (!roundup) {
      return new Response(JSON.stringify({ found: false }), { status: 200 });
    }
    return new Response(JSON.stringify({ found: true, ...roundup }), { status: 200 });
  } catch (error) {
    console.error('Error fetching daily roundup:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch daily roundup' }), { status: 500 });
  }
}
