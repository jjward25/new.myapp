// src/utils/mongoDB/journalCRUD.js
//
// Reads the most recent journal entry from Hermes' own `journal` collection
// (PersonalAgent db) -- same source Hermes itself reads via journal_list_recent.
// Read-only from the webapp side; entries are written by Hermes, not here.
import clientPromise from './mongoConnect';

export async function getLatestJournalEntry() {
  const client = await clientPromise;
  const db = client.db('PersonalAgent');
  const collection = db.collection('journal');

  const doc = await collection.find({}).sort({ entry_datetime: -1 }).limit(1).next();
  if (!doc) return null;

  return {
    content: doc.content,
    entryDatetime: doc.entry_datetime,
  };
}
