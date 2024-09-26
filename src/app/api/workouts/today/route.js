// src/app/api/workouts/today/route.js
import { getWorkout,updateWorkout } from '../../../../utils/mongoDB/workoutsCRUD';
import { getToday } from '../../../../utils/Date'; // Function to get today's date in 'YYYY-MM-DD' format

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
      const workouts = await getWorkout(); // Fetch all workouts
      const today = getToday(); // Get today's date

      // Filter workouts for today's date
      const todaysWorkouts = workouts.filter(workout => workout.Date === today);

      return new Response(JSON.stringify(todaysWorkouts), { status: 200 });
  } catch (error) {
      console.error('Error fetching today\'s workouts:', error);
      return new Response(JSON.stringify({ error: 'Unable to fetch today\'s workouts' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
      const workoutData = await req.json(); // Get the workout data from the request body
      console.log("Received workout data:", workoutData); // Log the incoming data

      // Validate the incoming data
      if (workoutData.date == null || workoutData.Exercises == null) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
      }

      const date = workoutData.date;

      // Call your update function
      await updateWorkout(date, workoutData.Exercises); // Pass the relevant data

      return new Response(JSON.stringify({ message: 'Workout updated successfully' }), { status: 200 });
  } catch (error) {
      console.error('Error updating workout:', error);
      return new Response(JSON.stringify({ error: 'Unable to update workout' }), { status: 500 });
  }
}



