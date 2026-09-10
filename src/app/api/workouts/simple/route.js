// src/app/api/workouts/simple/route.js
// Backed by Hermes' `workouts` collection now (see hermesWorkouts.js).
// Keeps the old {Type, Date, Exercises:[...]} shape on the wire so
// WeeklyGoalsSummary / SimpleWorkoutModal / the d3 charts didn't change.
import {
  listWorkoutEntries,
  logWorkoutEntry,
  deleteWorkoutEntry,
  setOneRepMax,
  getOneRepMaxes,
  toSimpleShape,
} from '../../../../utils/mongoDB/hermesWorkouts';

export const dynamic = 'force-dynamic';

const simpleCategory = (c) =>
  'simple_' + String(c || '').toLowerCase().replace(/\+/g, '_').replace(/\W+/g, '_');

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const [entries, orms] = await Promise.all([listWorkoutEntries({ sinceDays: 400 }), getOneRepMaxes()]);
    const shaped = toSimpleShape(entries);
    // Fold one_rep_maxes history back in as Category:'1RM' rows so
    // OneRepMaxChart keeps working unchanged.
    for (const orm of orms) {
      for (const h of orm.history || []) {
        let row = shaped.find((w) => w.Date === h.date);
        if (!row) { row = { _id: h.date, Type: 'simple', Date: h.date, Exercises: [] }; shaped.push(row); }
        row.Exercises.push({
          _id: `orm-${orm.exercise}-${h.date}`,
          Category: '1RM',
          ExerciseName: orm.exercise,
          [orm.unit === 'min' ? 'Time' : 'Weight']: h.weight,
        });
      }
    }
    shaped.sort((a, b) => String(b.Date).localeCompare(String(a.Date)));
    if (date) {
      return new Response(JSON.stringify(shaped.find((w) => w.Date === date) || null), { status: 200 });
    }
    return new Response(JSON.stringify(shaped), { status: 200 });
  } catch (error) {
    console.error('Error fetching simple workouts:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch workouts' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { date, exercise } = await req.json();
    if (!date || !exercise) {
      return new Response(JSON.stringify({ error: 'Date and exercise are required' }), { status: 400 });
    }

    if (exercise.Category === '1RM') {
      const val = exercise.ExerciseName === '5k' ? exercise.Time : exercise.Weight;
      await setOneRepMax(exercise.ExerciseName, val, exercise.ExerciseName === '5k' ? 'min' : 'lb');
      return new Response(JSON.stringify({ success: true }), { status: 201 });
    }

    if (exercise.Category === 'Cardio') {
      await logWorkoutEntry({
        exercise: exercise.ExerciseType || 'Jog',
        cardio: { miles: exercise.Miles ?? null, minutes: exercise.Time ?? null },
        category: 'cardio',
        sessionType: 'cardio',
        date,
      });
      return new Response(JSON.stringify({ success: true }), { status: 201 });
    }

    const setCount = Number(exercise.Sets) || 1;
    await logWorkoutEntry({
      exercise: exercise.ExerciseName || 'exercise',
      sets: Array.from({ length: setCount }, () => ({
        reps: exercise.Reps ?? null,
        weight: exercise.Weight ?? null,
      })),
      category: simpleCategory(exercise.Category),
      sessionType: 'workout',
      notes: exercise.Intensity ? `Intensity: ${exercise.Intensity}` : '',
      date,
    });
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    console.error('Error adding exercise:', error);
    return new Response(JSON.stringify({ error: 'Failed to add exercise' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { exerciseId } = await req.json();
    if (!exerciseId) {
      return new Response(JSON.stringify({ error: 'exerciseId is required' }), { status: 400 });
    }
    await deleteWorkoutEntry(exerciseId);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete exercise' }), { status: 500 });
  }
}
