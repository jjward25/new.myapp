// src/utils/mongoDB/hermesWorkouts.js
//
// Single source for workout data: Hermes' own `workouts` / `one_rep_maxes` /
// `fitness_program` collections, plus webapp-owned `workout_definitions`
// (the selector options + prescribed exercises) and `benchmarks` (the
// program's mobility measurements). Replaced the webapp's standalone
// `Workouts` mega-doc on 2026-09-10 -- see the seed migration. Everything
// the agent logs via `workout_log` and everything logged here land in the
// same `workouts` collection.
import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';

const DB = 'PersonalAgent';
const col = async (name) => (await clientPromise).db(DB).collection(name);

const iso = (d) => (d ? (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10) : null);

/* ---------------- raw workout entries ---------------- */

export async function listWorkoutEntries({ sinceDays, category, categoryPrefix, exercise } = {}) {
  const q = { type: 'workout_entry' };
  if (category) q.category = category;
  if (categoryPrefix) q.category = { $regex: `^${categoryPrefix}` };
  if (exercise) q.exercise_lower = String(exercise).toLowerCase();
  if (sinceDays) {
    const cutoff = new Date(Date.now() - Number(sinceDays) * 86_400_000);
    q.date = { $gte: cutoff };
  }
  const c = await col('workouts');
  const docs = await c.find(q).sort({ date: -1 }).toArray();
  return docs.map((d) => ({
    _id: String(d._id),
    exercise: d.exercise,
    session_type: d.session_type || 'workout',
    sets: d.sets || null,
    cardio: d.cardio || null,
    date: iso(d.date),
    category: d.category || '',
    notes: d.notes || '',
    rir: d.rir ?? null,
    rom: d.rom ?? null,
  }));
}

export async function logWorkoutEntry(entry) {
  const now = new Date();
  const exercise = String(entry.exercise || '').trim();
  if (!exercise) throw new Error('exercise is required');
  const doc = {
    type: 'workout_entry',
    agent: 'webapp',
    source: 'webapp',
    exercise,
    exercise_lower: exercise.toLowerCase(),
    session_type: entry.sessionType || entry.session_type || 'workout',
    sets: Array.isArray(entry.sets) && entry.sets.length ? entry.sets.map((s) => ({
      reps: s.reps ?? null,
      weight: s.weight ?? null,
      unit: s.unit || 'lb',
    })) : null,
    cardio: entry.cardio && (entry.cardio.miles != null || entry.cardio.minutes != null)
      ? { miles: entry.cardio.miles ?? null, minutes: entry.cardio.minutes ?? null }
      : null,
    date: entry.date ? new Date(`${iso(entry.date)}T12:00:00.000Z`) : now,
    category: entry.category || '',
    notes: entry.notes || '',
    rir: entry.rir ?? null,
    rom: entry.rom ?? null,
    created_at: now,
    updated_at: now,
  };
  const c = await col('workouts');
  const res = await c.insertOne(doc);
  return { _id: String(res.insertedId) };
}

export async function updateWorkoutEntry(id, fields) {
  const c = await col('workouts');
  const set = { updated_at: new Date() };
  for (const k of ['sets', 'cardio', 'notes', 'rir', 'rom', 'category', 'exercise']) {
    if (fields[k] !== undefined) set[k] = fields[k];
  }
  if (set.exercise) set.exercise_lower = String(set.exercise).toLowerCase();
  return c.updateOne({ _id: new ObjectId(id) }, { $set: set });
}

export async function deleteWorkoutEntry(id) {
  const c = await col('workouts');
  return c.deleteOne({ _id: new ObjectId(id) });
}

/* ---------------- workout definitions (selector) ---------------- */

export async function getDefinitions() {
  const c = await col('workout_definitions');
  return (await c.find({}).sort({ order: 1 }).toArray()).map((d) => ({
    key: d.key,
    label: d.label,
    session_type: d.session_type,
    category: d.category,
    freeform: !!d.freeform,
    description: d.description || '',
    exercises: d.exercises || [],
  }));
}

/* ---------------- benchmarks ---------------- */

export async function getBenchmarks() {
  const c = await col('benchmarks');
  return (await c.find({}).sort({ key: 1 }).toArray()).map((d) => {
    const history = (d.history || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const latest = history[history.length - 1];
    return {
      key: d.key,
      label: d.label,
      unit: d.unit,
      direction: d.direction,
      baseline: d.baseline ?? null,
      target: d.target ?? null,
      note: d.note || '',
      current: latest ? latest.value : (d.baseline ?? null),
      lastMeasured: latest ? latest.date : null,
      history,
    };
  });
}

export async function logBenchmark(key, value, note) {
  const c = await col('benchmarks');
  const entry = { date: new Date().toISOString().slice(0, 10), value: value === '' || value == null ? null : Number(value), note: note || '' };
  return c.updateOne({ key }, { $push: { history: entry }, $set: { updated_at: new Date() } });
}

/* ---------------- one-rep maxes ---------------- */

export async function getOneRepMaxes() {
  const c = await col('one_rep_maxes');
  return (await c.find({}).sort({ exercise_lower: 1 }).toArray()).map((d) => ({
    exercise: d.exercise,
    weight: d.weight,
    unit: d.unit || 'lb',
    notes: d.notes || '',
    updated_at: d.updated_at ? new Date(d.updated_at).toISOString() : null,
    history: (d.history || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))),
  }));
}

export async function setOneRepMax(exercise, weight, unit = 'lb') {
  const c = await col('one_rep_maxes');
  const now = new Date();
  const ex = String(exercise).trim();
  const entry = { date: now.toISOString().slice(0, 10), weight: Number(weight) };
  return c.updateOne(
    { exercise_lower: ex.toLowerCase() },
    {
      $set: { agent: 'webapp', exercise: ex, exercise_lower: ex.toLowerCase(), weight: Number(weight), unit, updated_at: now },
      $setOnInsert: { created_at: now },
      $push: { history: entry },
    },
    { upsert: true }
  );
}

/* ---------------- translation to the webapp's legacy shapes ---------------- */

// Old /api/workouts/simple item shape, rebuilt from `workouts` entries so
// WeeklyGoalsSummary / SimpleWorkoutModal / the d3 charts keep working.
export function toSimpleShape(entries) {
  const byDate = {};
  for (const e of entries) {
    (byDate[e.date] ||= { _id: e.date, Type: 'simple', Date: e.date, Exercises: [] });
    const catFromSimple = e.category.startsWith('simple_')
      ? e.category.slice('simple_'.length).replace(/_/g, '+').replace(/\b\w/g, (c) => c.toUpperCase()).replace('Plus', '+')
      : null;
    if (e.cardio) {
      byDate[e.date].Exercises.push({
        _id: e._id, Category: 'Cardio', ExerciseType: e.exercise,
        Miles: e.cardio.miles ?? undefined, Time: e.cardio.minutes ?? undefined,
      });
    } else {
      const setCount = Array.isArray(e.sets) ? e.sets.length : undefined;
      const firstSet = Array.isArray(e.sets) && e.sets[0] ? e.sets[0] : {};
      byDate[e.date].Exercises.push({
        _id: e._id,
        Category: catFromSimple || prettyCategory(e.category),
        ExerciseName: e.exercise,
        Intensity: /Intensity: (\w+)/.exec(e.notes)?.[1],
        Sets: setCount,
        Reps: firstSet.reps ?? undefined,
        Weight: firstSet.weight || undefined,
      });
    }
  }
  return Object.values(byDate).sort((a, b) => String(b.Date).localeCompare(String(a.Date)));
}

function prettyCategory(cat) {
  const map = {
    stretch: 'Mon Stretch', squeeze: 'Wed Squeeze', '360': 'Fri 360',
    speed: 'Sat Speed', durability: 'Sun Durability', morning_mobility: 'Morning',
    nightly: 'Nightly', cardio: 'Cardio',
  };
  if (map[cat]) return map[cat];
  if (cat.startsWith('legacy_')) return `Legacy ${cat.slice(7).toUpperCase()}`;
  return cat || 'Other';
}

// Old /api/workouts compound shape (Exercises keyed by name, Sets array).
export function toCompoundShape(entries) {
  const byKey = {};
  for (const e of entries) {
    const k = `${e.date}|${e.category}`;
    (byKey[k] ||= {
      _id: k, Date: e.date, Day: e.category.startsWith('legacy_') ? e.category.slice(7) : '',
      WorkoutName: /^(.*?) —/.exec(e.notes)?.[1] || '', Exercises: {},
    });
    byKey[k].Exercises[e.exercise] = {
      ExerciseType: /— (\w+)$/.exec(e.notes)?.[1] || 'Compound',
      Sets: (e.sets || []).map((s, i) => ({ SetNumber: i + 1, Reps: s.reps ?? 0, Weight: s.weight ?? 0 })),
    };
  }
  return Object.values(byKey).sort((a, b) => String(b.Date).localeCompare(String(a.Date)));
}
