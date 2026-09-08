// src/app/api/health/ingest/route.js
// Apple Health -> Personal.Activities. Strava's API now needs a paid
// subscription to register an app, so runs come from the phone instead.
//
// Feed it from either:
//   * "Health Auto Export" (iOS) REST automation — POST its JSON here
//   * an Apple Shortcut — POST { "runs": [{ "date": "2026-09-08",
//     "miles": 3.1, "name": "Morning run", "seconds": 1680 }] }
//
// Auth: ?token=<HEALTH_INGEST_TOKEN> or header x-health-token. Ungated in
// middleware; carries its own token.
import { NextResponse } from 'next/server';
import clientPromise from '@/utils/mongoDB/mongoConnect';
import { formatDateEST } from '@/utils/dateUtils';

export const dynamic = 'force-dynamic';

const RUN_HINT = /run|jog/i;
const toMiles = (qty, units) => {
  const u = String(units || '').toLowerCase();
  if (u.includes('km')) return qty * 0.621371;
  if (u === 'm' || u.includes('meter')) return qty / 1609.344;
  return qty; // assume miles
};

function extractRuns(body) {
  const runs = [];

  // 1. simple Shortcut shape
  if (Array.isArray(body.runs)) {
    body.runs.forEach((r, i) => {
      const miles = Number(r.miles ?? r.distance ?? 0);
      if (miles > 0) {
        runs.push({
          _id: r.id || `shortcut-${r.date}-${i}`,
          date: formatDateEST(r.date || new Date()),
          miles,
          name: r.name || 'Run',
          moving_time: r.seconds ?? null,
        });
      }
    });
  }

  // 2. Health Auto Export shape: { data: { workouts: [...] } }
  const workouts = body?.data?.workouts || body?.workouts || [];
  workouts.forEach((w) => {
    const type = w.workoutActivityType || w.name || w.type || '';
    if (!RUN_HINT.test(type)) return;
    const dq = w.distance?.qty ?? w.distance ?? w.totalDistance?.qty ?? 0;
    const du = w.distance?.units ?? w.totalDistance?.units ?? 'mi';
    const miles = toMiles(Number(dq) || 0, du);
    if (miles <= 0) return;
    runs.push({
      _id: `hae-${w.id || w.start}`,
      date: formatDateEST(w.start || w.startDate || new Date()),
      miles: Math.round(miles * 100) / 100,
      name: type,
      moving_time: w.duration ? Math.round(Number(w.duration)) : null,
    });
  });

  return runs;
}

async function ingest(body) {
  const runs = extractRuns(body);
  if (!runs.length) return { stored: 0 };
  const coll = (await clientPromise).db('Personal').collection('Activities');
  for (const r of runs) {
    await coll.updateOne(
      { _id: r._id },
      { $set: { ...r, source: 'apple-health', type: 'Run', syncedAt: new Date().toISOString() } },
      { upsert: true }
    );
  }
  return { stored: runs.length };
}

function authed(req) {
  const want = process.env.HEALTH_INGEST_TOKEN;
  if (!want) return false; // must be configured
  const url = new URL(req.url);
  return url.searchParams.get('token') === want || req.headers.get('x-health-token') === want;
}

export async function POST(req) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    return NextResponse.json(await ingest(body));
  } catch (e) {
    console.error('health ingest', e);
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
