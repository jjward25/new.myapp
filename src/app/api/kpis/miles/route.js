// src/app/api/kpis/miles/route.js
//
// Lets the homepage miles-run KPI be hand-set for the current week (e.g. no
// Apple Health connection yet, or a correction). Stored as a single
// deterministic doc per week in Activities so it upserts cleanly; the /api/kpis
// route treats it as an override that replaces (not adds to) that week's
// computed sum.
import { NextResponse } from 'next/server';
import clientPromise from '@/utils/mongoDB/mongoConnect';
import { APP_DB } from '@/utils/mongoDB/dbName';
import { getWeekBoundsEST, getNowEST } from '@/utils/dateUtils';

export const dynamic = 'force-dynamic';

const overrideId = (weekStart) => `manual-week-${weekStart}`;

export async function POST(req) {
  try {
    const { miles } = await req.json();
    const n = Number(miles);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: 'miles must be a non-negative number' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db(APP_DB);
    const week = getWeekBoundsEST(getNowEST());
    await db.collection('Activities').updateOne(
      { _id: overrideId(week.start) },
      {
        $set: {
          source: 'manual',
          type: 'Run',
          date: week.start,
          miles: n,
          manualOverride: true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    return NextResponse.json({ ok: true, miles: n });
  } catch (error) {
    console.error('Error setting manual miles:', error);
    return NextResponse.json({ error: 'Failed to update miles' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db(APP_DB);
    const week = getWeekBoundsEST(getNowEST());
    await db.collection('Activities').deleteOne({ _id: overrideId(week.start) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error clearing manual miles override:', error);
    return NextResponse.json({ error: 'Failed to clear override' }, { status: 500 });
  }
}
