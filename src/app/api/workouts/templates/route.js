import { getWorkoutTemplates } from '../../../../utils/mongoDB/workoutsCRUD';
import { USE_MOCK_WORKOUTS, mockTemplates } from '../../../../utils/mockWorkoutData';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const templates = USE_MOCK_WORKOUTS ? mockTemplates : await getWorkoutTemplates();

    if (templates) {
      return new Response(JSON.stringify({ Templates: templates }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: 'No templates found' }), { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching workout templates:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch workout templates' }), { status: 500 });
  }
} 