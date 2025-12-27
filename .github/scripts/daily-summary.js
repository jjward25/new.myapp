// .github/scripts/daily-summary.js
// Sends a personalized daily morning summary with goal tracking and accountability

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Workout targets (from SimpleWorkoutModal)
const WORKOUT_TARGETS = {
  'Cardio': 3,
  'Chest+Tris': 2,
  'Shoulders': 2,
  'Quads': 2,
  'Hamstrings': 2,
  'Hips': 2,
  'Back+Bis': 2,
  'Core': 2
};

// Routine targets
const ROUTINE_TARGETS = {
  mobility: 5,
  lift: 2,
  cardio: 3,
  language: 5,
  piano: 5,
  readLearn: 7,
  journal: 7
};

async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
}

// Get week bounds (Monday to Sunday)
function getWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  
  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

function formatDateStr(date) {
  return date.toISOString().split('T')[0];
}

function getDaysRemainingInWeek(now) {
  const day = now.getDay();
  // Sunday = 0, so remaining = 0; Monday = 1, remaining = 6; etc.
  return day === 0 ? 0 : 7 - day;
}

// Check if on pace to hit target
function isOnPace(current, target, daysRemaining, totalDays = 7) {
  const daysPassed = totalDays - daysRemaining;
  if (daysPassed === 0) return true; // Start of week
  const neededPace = target / totalDays;
  const currentPace = current / daysPassed;
  // Also check if mathematically possible to hit target
  const maxPossible = current + daysRemaining;
  return maxPossible >= target;
}

async function main() {
  if (!MONGODB_URI || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('Personal');

    // Get current time in EST
    const now = new Date();
    const estOffset = -5 * 60; // EST is UTC-5
    const estNow = new Date(now.getTime() + (estOffset - now.getTimezoneOffset()) * 60000);
    
    const thisWeek = getWeekBounds(estNow);
    const lastWeekDate = new Date(estNow);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeek = getWeekBounds(lastWeekDate);
    
    const thisWeekStartStr = formatDateStr(thisWeek.start);
    const thisWeekEndStr = formatDateStr(thisWeek.end);
    const lastWeekStartStr = formatDateStr(lastWeek.start);
    const lastWeekEndStr = formatDateStr(lastWeek.end);
    
    const dayOfWeek = estNow.getDay(); // 0 = Sunday, 3 = Wednesday
    const daysRemaining = getDaysRemainingInWeek(estNow);

    // Yesterday's date for journal
    const yesterday = new Date(estNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateStr(yesterday);

    console.log(`Running daily summary for ${formatDateStr(estNow)}`);

    // ============ FETCH DATA ============

    // 1. Workouts (simple type)
    const workoutData = await db.collection('Workouts').find({}).toArray();
    const allWorkouts = workoutData[0]?.Workouts || [];
    const simpleWorkouts = allWorkouts.filter(w => w.Type === 'simple');

    // Count workout categories this week
    const workoutCounts = {};
    Object.keys(WORKOUT_TARGETS).forEach(cat => { workoutCounts[cat] = 0; });
    
    let milesThisWeek = 0;
    let milesLastWeek = 0;
    const oneRMsThisWeek = [];

    simpleWorkouts.forEach(workout => {
      const workoutDate = workout.Date;
      const exercises = workout.Exercises || [];
      
      exercises.forEach(ex => {
        // This week workouts
        if (workoutDate >= thisWeekStartStr && workoutDate <= thisWeekEndStr) {
          if (workoutCounts[ex.Category] !== undefined) {
            workoutCounts[ex.Category]++;
          }
          if (ex.Category === 'Cardio' && ex.Miles) {
            milesThisWeek += Number(ex.Miles) || 0;
          }
          if (ex.Category === '1RM') {
            oneRMsThisWeek.push({
              exercise: ex.ExerciseName,
              value: ex.Weight || ex.Time,
              unit: ex.ExerciseName === '5k' ? 'min' : 'lbs'
            });
          }
        }
        // Last week miles
        if (workoutDate >= lastWeekStartStr && workoutDate <= lastWeekEndStr) {
          if (ex.Category === 'Cardio' && ex.Miles) {
            milesLastWeek += Number(ex.Miles) || 0;
          }
        }
      });
    });

    // 2. Routines
    const routines = await db.collection('Routines').find({}).toArray();
    
    const routineCounts = {
      mobility: 0,
      lift: 0,
      cardio: 0,
      language: 0,
      piano: 0,
      readLearn: 0,
      journal: 0
    };

    let yesterdayJournal = null;

    routines.forEach(r => {
      const routineDate = r.Date;
      
      // This week routines
      if (routineDate >= thisWeekStartStr && routineDate <= thisWeekEndStr) {
        if (r.Mobility) routineCounts.mobility++;
        if (r.Exercise === 'Lift') routineCounts.lift++;
        if (r.Exercise === 'Cardio') routineCounts.cardio++;
        if (r.Language) routineCounts.language++;
        if (r.Piano) routineCounts.piano++;
        if (r.ReadLearn && r.ReadLearn.length > 0) routineCounts.readLearn++;
        if (r.Journal && r.Journal.trim()) routineCounts.journal++;
      }
      
      // Yesterday's journal
      if (routineDate === yesterdayStr && r.Journal && r.Journal.trim()) {
        yesterdayJournal = r.Journal;
      }
    });

    // 3. Call list check
    const lists = await db.collection('Lists').find({ name: 'Call' }).toArray();
    const callList = lists[0];
    let calledSomeoneThisWeek = false;

    if (callList && callList.items) {
      callList.items.forEach(item => {
        if (item.lastContactedDate && item.lastContactedDate >= thisWeekStartStr) {
          calledSomeoneThisWeek = true;
        }
      });
    }

    // 4. Events this week
    const events = await db.collection('Calendar').find({}).toArray();
    let eventsThisWeek = 0;
    
    events.forEach(event => {
      const eventDate = event.date;
      if (eventDate && eventDate >= thisWeekStartStr && eventDate <= thisWeekEndStr) {
        eventsThisWeek++;
      }
    });

    // 5. P0 Milestones completed this week
    const projects = await db.collection('Projects').find({}).toArray();
    const p0sCompletedThisWeek = [];

    projects.forEach(project => {
      const milestones = project.Milestones || {};
      Object.entries(milestones).forEach(([name, milestone]) => {
        if (Number(milestone['Milestone Priority']) === 0 && milestone['Complete Date']) {
          const completeDate = milestone['Complete Date'];
          if (completeDate >= thisWeekStartStr && completeDate <= thisWeekEndStr) {
            p0sCompletedThisWeek.push(name);
          }
        }
      });
    });

    // 6. Open Tasks (FIXED: use "Complete Date" not completeDate)
    const tasks = await db.collection('Backlog').find({}).toArray();
    const openTasks = tasks.filter(task => {
      const hasNoCompleteDate = !task['Complete Date'];
      const isNotMissed = task.Missed !== true;
      return hasNoCompleteDate && isNotMissed;
    });

    // ============ CALCULATE GOAL STATUS ============

    // Workout goal status
    let workoutGoalsFailing = 0;
    let workoutGoalsTotal = Object.keys(WORKOUT_TARGETS).length;

    Object.entries(WORKOUT_TARGETS).forEach(([cat, target]) => {
      if (!isOnPace(workoutCounts[cat], target, daysRemaining)) {
        workoutGoalsFailing++;
      }
    });

    // Routine goal status
    let routineGoalsFailing = 0;
    let routineGoalsTotal = Object.keys(ROUTINE_TARGETS).length;

    Object.entries(ROUTINE_TARGETS).forEach(([key, target]) => {
      if (!isOnPace(routineCounts[key], target, daysRemaining)) {
        routineGoalsFailing++;
      }
    });

    // ============ BUILD MESSAGE ============

    let message = `☀️ <b>Good Morning! Here's your status report, Mr. Ward:</b>\n\n`;

    // Goal Warnings
    const workoutFailPercent = workoutGoalsFailing / workoutGoalsTotal;
    const routineFailPercent = routineGoalsFailing / routineGoalsTotal;

    if (workoutFailPercent > 0.5) {
      message += `🚨 <i>Get a move on pussy! You're on track to fail your fitness goals this week!</i>\n\n`;
    } else if (workoutGoalsFailing > 0) {
      message += `⚠️ <i>Close out strong! You're still missing a few workouts!</i>\n\n`;
    } else {
      message += `⚔️ <i>The Iron Throne will be yours - your body is trained.</i>\n\n`;
    }

    if (routineGoalsFailing === 0) {
      message += `🧠 <i>The Iron Throne will be yours - your mind is trained.</i>\n\n`;
    }

    // Call check (Wednesday = 3 or later, but also check Sunday = 0 which is end of week)
    if ((dayOfWeek >= 3 || dayOfWeek === 0) && !calledSomeoneThisWeek) {
      message += `📞 <i>Try making some friends; we're halfway through the week and you haven't called anyone.</i>\n\n`;
    }

    // Events check
    if (eventsThisWeek < 2) {
      message += `📅 <i>Did you run out of money? Go do something with your life.</i>\n\n`;
    }

    // Weekly Summary
    message += `<b>📊 Overall for the week:</b>\n`;
    
    // Miles comparison
    const milesDiff = milesThisWeek - milesLastWeek;
    const milesArrow = milesDiff >= 0 ? '↑' : '↓';
    message += `• Miles run: <b>${milesThisWeek.toFixed(1)}</b> mi (${milesArrow}${Math.abs(milesDiff).toFixed(1)} vs last week)\n`;

    // 1RMs (only if any)
    if (oneRMsThisWeek.length > 0) {
      message += `• 1RMs recorded:\n`;
      oneRMsThisWeek.forEach(rm => {
        message += `  - ${rm.exercise}: ${rm.value} ${rm.unit}\n`;
      });
    }

    // P0 Milestones (only if any)
    if (p0sCompletedThisWeek.length > 0) {
      message += `• P0 Milestones completed: <b>${p0sCompletedThisWeek.length}</b>\n`;
      p0sCompletedThisWeek.forEach(name => {
        message += `  - ${name}\n`;
      });
    }

    // Open Tasks
    message += `• Open Tasks: <b>${openTasks.length}</b>\n`;

    // Yesterday's Journal
    if (yesterdayJournal) {
      message += `\n<b>📝 Last night's journal:</b>\n`;
      message += `<i>"${yesterdayJournal}"</i>\n`;
    }

    message += `\n💪 <i>Make it a great day!</i>`;

    await sendTelegramMessage(message);
    console.log('Daily summary sent successfully');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

main();
