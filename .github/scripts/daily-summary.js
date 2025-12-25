// .github/scripts/daily-summary.js
// Sends a daily morning summary of today's events and open backlog tasks

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

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

function formatTime(time) {
  if (!time) return 'All day';
  const [hours, minutes] = time.split(':');
  const hour12 = parseInt(hours) % 12 || 12;
  const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
}

function formatDate(date) {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
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
    const calendarCollection = db.collection('Calendar');
    const backlogCollection = db.collection('Backlog');

    // Get today's date in EST
    const now = new Date();
    const estOffset = -5 * 60; // EST is UTC-5
    const estNow = new Date(now.getTime() + (estOffset - now.getTimezoneOffset()) * 60000);
    
    // Get today's date range
    const todayStart = new Date(estNow);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    console.log(`Fetching data for: ${formatDate(estNow)}`);

    // Fetch today's calendar events
    const events = await calendarCollection.find({
      date: {
        $gte: todayStart.toISOString(),
        $lt: todayEnd.toISOString()
      }
    }).toArray();

    // Sort events by time
    events.sort((a, b) => {
      const timeA = a.time || '23:59';
      const timeB = b.time || '23:59';
      return timeA.localeCompare(timeB);
    });

    // Fetch open backlog tasks (no completeDate)
    const openTasks = await backlogCollection.find({
      completeDate: { $exists: false },
      type: 'Task'
    }).toArray();

    console.log(`Found ${events.length} events and ${openTasks.length} open tasks`);

    // Build the summary message
    let message = `☀️ <b>Good Morning!</b>\n`;
    message += `📅 ${formatDate(estNow)}\n\n`;

    // Events section
    message += `<b>📆 Today's Events</b>\n`;
    if (events.length === 0) {
      message += `<i>No events scheduled</i>\n`;
    } else {
      events.forEach(event => {
        message += `• ${formatTime(event.time)} - <b>${event.title}</b>`;
        if (event.location) {
          message += ` (${event.location})`;
        }
        message += `\n`;
      });
    }

    message += `\n<b>📋 Open Backlog Tasks</b> (${openTasks.length})\n`;
    if (openTasks.length === 0) {
      message += `<i>No open tasks - great job!</i>\n`;
    } else {
      // Show up to 10 tasks
      const tasksToShow = openTasks.slice(0, 10);
      tasksToShow.forEach(task => {
        const title = task.title || task.name || 'Untitled task';
        message += `• ${title}\n`;
      });
      if (openTasks.length > 10) {
        message += `<i>...and ${openTasks.length - 10} more</i>\n`;
      }
    }

    message += `\n<i>Have a productive day!</i> 💪`;

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


