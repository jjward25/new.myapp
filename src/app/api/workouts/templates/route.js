// src/app/api/workouts/templates/route.js
// Rebuilt from `workout_definitions` (the legacy_A..D entries) instead of
// the retired Workouts mega-doc's Templates field.
import { getDefinitions } from '../../../../utils/mongoDB/hermesWorkouts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const defs = await getDefinitions();
    const legacy = defs.filter((d) => d.key.startsWith('legacy_'));
    if (!legacy.length) {
      return new Response(JSON.stringify({ error: 'No templates found' }), { status: 404 });
    }
    const Templates = {};
    for (const d of legacy) {
      const dayKey = `Day_${d.key.slice('legacy_'.length)}`;
      const Exercises = {};
      for (const ex of d.exercises) {
        Exercises[ex.name] = {
          Superset: ex.superset || '',
          Sets: ex.sets || '',
          Reps: ex.reps || '',
          Group: ex.group || '',
          Emphasis: ex.note || '',
          Time: 'Morning',
        };
      }
      Templates[dayKey] = { Name: d.label.replace(/^Legacy [A-D] — /, ''), Exercises };
    }
    return new Response(JSON.stringify({ Templates }), { status: 200 });
  } catch (error) {
    console.error('Error fetching workout templates:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch workout templates' }), { status: 500 });
  }
}
