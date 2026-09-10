// src/app/api/workouts/route.js
// Backed by Hermes' `workouts` collection. Returns the legacy compound
// shape (Exercises keyed by name, Sets array) for the /workouts legacy page.
import {
  listWorkoutEntries,
  logWorkoutEntry,
  updateWorkoutEntry,
  deleteWorkoutEntry,
  toCompoundShape,
} from '../../../utils/mongoDB/hermesWorkouts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const entries = await listWorkoutEntries({ categoryPrefix: 'legacy_' });
    return new Response(JSON.stringify(toCompoundShape(entries)), { status: 200 });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch workouts' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const item = await req.json();
    const day = item.Day ? `legacy_${item.Day}` : 'legacy';
    const created = [];
    for (const [name, d] of Object.entries(item.Exercises || {})) {
      const sets = (d.Sets || []).map((s) => ({ reps: s.Reps ?? null, weight: s.Weight ?? null }));
      const res = await logWorkoutEntry({
        exercise: name,
        sets: sets.length ? sets : null,
        category: day,
        sessionType: 'workout',
        notes: [item.WorkoutName, d.ExerciseType].filter(Boolean).join(' — '),
        date: item.Date,
      });
      created.push(res._id);
    }
    return new Response(JSON.stringify({ ok: true, created }), { status: 201 });
  } catch (error) {
    console.error('Error adding workout:', error);
    return new Response(JSON.stringify({ error: 'Unable to add workout' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, updatedItem } = await req.json();
    await updateWorkoutEntry(id, updatedItem);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    console.error('Error updating workout:', error);
    return new Response(JSON.stringify({ error: 'Unable to update workout' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await deleteWorkoutEntry(id);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return new Response(JSON.stringify({ error: 'Unable to delete workout' }), { status: 500 });
  }
}
