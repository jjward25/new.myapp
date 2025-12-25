// .github/scripts/event-reminder.js
// Checks for calendar events starting within 45-75 minutes and sends Telegram notifications

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
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour12 = parseInt(hours) % 12 || 12;
  const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
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
    const collection = db.collection('Calendar');

    // Get current time in EST
    const now = new Date();
    const estOffset = -5 * 60; // EST is UTC-5
    const estNow = new Date(now.getTime() + (estOffset - now.getTimezoneOffset()) * 60000);
    
    const currentHour = estNow.getHours();
    const currentMinute = estNow.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Get today's date in EST (start of day)
    const todayStart = new Date(estNow);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    console.log(`Current EST time: ${estNow.toISOString()}`);
    console.log(`Looking for events between ${todayStart.toISOString()} and ${todayEnd.toISOString()}`);

    // Fetch all events for today
    const events = await collection.find({
      date: {
        $gte: todayStart.toISOString(),
        $lt: todayEnd.toISOString()
      }
    }).toArray();

    console.log(`Found ${events.length} events for today`);

    // Filter events that start within 45-75 minutes from now
    const upcomingEvents = events.filter(event => {
      if (!event.time) return false;
      
      const [eventHour, eventMinute] = event.time.split(':').map(Number);
      const eventTotalMinutes = eventHour * 60 + eventMinute;
      const minutesUntilEvent = eventTotalMinutes - currentTotalMinutes;

      // Check if event is 45-75 minutes away (to account for 15-min cron interval)
      return minutesUntilEvent >= 45 && minutesUntilEvent <= 75;
    });

    console.log(`Found ${upcomingEvents.length} events starting in ~1 hour`);

    // Send notification for each upcoming event
    for (const event of upcomingEvents) {
      const message = `⏰ <b>Event Reminder</b>\n\n` +
        `<b>${event.title}</b>\n` +
        `🕐 ${formatTime(event.time)}\n` +
        (event.location ? `📍 ${event.location}\n` : '') +
        (event.description ? `\n${event.description}` : '');

      await sendTelegramMessage(message);
      console.log(`Sent reminder for: ${event.title}`);
    }

    if (upcomingEvents.length === 0) {
      console.log('No events to notify about');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

main();


