// .github/scripts/event-reminder.js
// Checks for calendar events and sends Telegram notifications
// Tracks sent alerts to prevent duplicates

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Alert configuration: type, time window, and message prefix
const ALERT_TYPES = [
  { type: 'hour', minMinutes: 45, maxMinutes: 75, label: '1 Hour' },
  { type: '15min', minMinutes: 10, maxMinutes: 20, label: '15 Minutes' }
];

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

async function markAlertSent(collection, eventId, alertType) {
  await collection.updateOne(
    { _id: new ObjectId(eventId) },
    { $addToSet: { alertsSent: alertType } }
  );
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

    // Fetch all events for today that have a time set
    const events = await collection.find({
      date: {
        $gte: todayStart.toISOString(),
        $lt: todayEnd.toISOString()
      },
      time: { $exists: true, $ne: '' }
    }).toArray();

    console.log(`Found ${events.length} timed events for today`);

    let alertsSent = 0;

    // Check each event against each alert type
    for (const event of events) {
      const [eventHour, eventMinute] = event.time.split(':').map(Number);
      const eventTotalMinutes = eventHour * 60 + eventMinute;
      const minutesUntilEvent = eventTotalMinutes - currentTotalMinutes;

      // Get existing alerts sent for this event
      const existingAlerts = event.alertsSent || [];

      for (const alertConfig of ALERT_TYPES) {
        // Check if this alert type is already sent
        if (existingAlerts.includes(alertConfig.type)) {
          continue;
        }

        // Check if event falls within this alert's time window
        if (minutesUntilEvent >= alertConfig.minMinutes && minutesUntilEvent <= alertConfig.maxMinutes) {
          const message = `⏰ <b>${alertConfig.label} Reminder</b>\n\n` +
            `<b>${event.title}</b>\n` +
            `🕐 ${formatTime(event.time)}\n` +
            (event.location ? `📍 ${event.location}\n` : '') +
            (event.description ? `\n${event.description}` : '');

          await sendTelegramMessage(message);
          await markAlertSent(collection, event._id, alertConfig.type);
          
          console.log(`Sent ${alertConfig.label} reminder for: ${event.title}`);
          alertsSent++;
        }
      }
    }

    if (alertsSent === 0) {
      console.log('No new alerts to send');
    } else {
      console.log(`Sent ${alertsSent} alert(s)`);
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
