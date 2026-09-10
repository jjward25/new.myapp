// src/app/api/workouts/log/route.js
// Structured logging for the workout-selector logger: one call per exercise,
// carrying its sets (reps/weight), RIR, ROM flag, and which workout it
// belonged to. Lands in Hermes' `workouts` collection.
import { logWorkoutEntry, listWorkoutEntries, deleteWorkoutEntry } from '../../../../utils/mongoDB/hermesWorkouts';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sinceDays = Number(searchParams.get('sinceDays')) || 30;
    const exercise = searchParams.get('exercise') || undefined;
    const category = searchParams.get('category') || undefined;
    return new Response(JSON.stringify(await listWorkoutEntries({ sinceDays, exercise, category })), { status: 200 });
  } catch (error) {
    console.error('workout log GET', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch log' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    // Accept either one entry or a batch.
    const entries = Array.isArray(body) ? body : [body];
    const ids = [];
    for (const e of entries) ids.push((await logWorkoutEntry(e))._id);
    return new Response(JSON.stringify({ ok: true, ids }), { status: 201 });
  } catch (error) {
    console.error('workout log POST', error);
    return new Response(JSON.stringify({ error: String(error.message || error) }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await deleteWorkoutEntry(id);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    console.error('workout log DELETE', error);
    return new Response(JSON.stringify({ error: 'Unable to delete' }), { status: 500 });
  }
}
