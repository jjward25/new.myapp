import { NextResponse } from 'next/server';
import clientPromise from '@/utils/mongoDB/mongoConnect';
import { getIntegration, saveIntegration } from '@/utils/mongoDB/integrationsCRUD';
import { fetchActivities } from '@/utils/strava';
import { formatDateEST } from '@/utils/dateUtils';

export const dynamic = 'force-dynamic';

const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun']);

async function sync() {
  const it = await getIntegration('strava');
  if (!it) return { error: 'strava not connected' };

  const since = it.lastSyncAt
    ? Math.floor(new Date(it.lastSyncAt).getTime() / 1000) - 86400 // 1d overlap
    : Math.floor(Date.now() / 1000) - 60 * 86400; // first run: 60 days

  const acts = await fetchActivities(since);
  const client = await clientPromise;
  const coll = client.db('Personal').collection('Activities');

  let runs = 0;
  for (const a of acts) {
    const doc = {
      _id: String(a.id),
      source: 'strava',
      type: a.type,
      name: a.name,
      date: formatDateEST(a.start_date), // YYYY-MM-DD EST
      miles: Math.round((a.distance / 1609.344) * 100) / 100,
      moving_time: a.moving_time,
      elapsed_time: a.elapsed_time,
    };
    await coll.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
    if (RUN_TYPES.has(a.type)) runs++;
  }

  await saveIntegration('strava', { lastSyncAt: new Date().toISOString() });
  return { fetched: acts.length, runs };
}

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev / manual
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await sync());
  } catch (e) {
    console.error('strava sync', e);
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

// Vercel Cron issues GET
export async function GET(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await sync());
  } catch (e) {
    console.error('strava sync', e);
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
