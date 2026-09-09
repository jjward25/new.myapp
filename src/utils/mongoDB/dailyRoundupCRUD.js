// src/utils/mongoDB/dailyRoundupCRUD.js
//
// Reads the daily news-roundup + knowledge-graph digest that Hermes' local
// "Morning Roundup" cron job writes via the daily_roundup_save tool
// (plugins/mongodb, PersonalAgent.daily_roundups, one doc per date, keyed
// by `date`). Added 2026-09-08 specifically because the webapp (Vercel, no
// filesystem access to the laptop) can't reach the cron job's local
// Obsidian-vault copy of the same content -- this is the read side of that
// same digest, not a separate/different roundup.
import clientPromise from './mongoConnect';
import { APP_DB } from './dbName';

export async function getLatestDailyRoundup() {
  const client = await clientPromise;
  const db = client.db(APP_DB);
  const collection = db.collection('daily_roundups');

  const doc = await collection.find({}).sort({ date: -1 }).limit(1).next();
  if (!doc) return null;

  return {
    date: doc.date,
    content: doc.content,
    updatedAt: doc.updated_at,
  };
}
