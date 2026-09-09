// src/app/api/journal/latest/route.js
//
// Fast, direct Mongo read of the most recent journal entry -- same pattern
// as api/roundup and api/workouts/simple, no gateway call needed.
import { getLatestJournalEntry } from '../../../../utils/mongoDB/journalCRUD';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const entry = await getLatestJournalEntry();
    if (!entry) {
      return new Response(JSON.stringify({ found: false }), { status: 200 });
    }
    return new Response(JSON.stringify({ found: true, ...entry }), { status: 200 });
  } catch (error) {
    console.error('Error fetching latest journal entry:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch journal entry' }), { status: 500 });
  }
}
