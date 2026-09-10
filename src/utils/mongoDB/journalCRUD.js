// src/utils/mongoDB/journalCRUD.js
//
// Hermes' own `journal` collection (PersonalAgent db) -- same source Hermes
// itself reads/writes via journal_create_entry/journal_list_recent/journal_search.
// The webapp now writes here too (2026-09-10), from the Daily Check-In's
// Journal field, so both surfaces land in one place instead of the check-in's
// text living only in Personal.Routines where Hermes never saw it. Docs
// written here match Hermes' shape (type/content/entry_datetime/created_at/
// updated_at) plus a `source`/`routine_date` pair used to upsert idempotently
// (one mirrored entry per check-in day, not a new one per edit) and an
// `agent: "webapp"` tag so it's traceable back to this form rather than
// claiming to be something Hermes itself wrote. One thing this webapp write
// path does NOT do: generate the embedding Hermes attaches for semantic
// search (that model only runs locally, Python-side) -- these entries are
// still found by journal_list_recent and by Atlas Search's lexical text
// index, just not by the embedding half of the hybrid search.
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

// One journal entry per check-in day -- re-saving the same day's Journal
// field updates the same doc instead of piling up duplicates.
export async function upsertRoutineJournalEntry(routineDate, content) {
  const client = await clientPromise;
  const db = client.db('PersonalAgent');
  const collection = db.collection('journal');
  const now = new Date();

  await collection.updateOne(
    { source: 'webapp_checkin', routine_date: routineDate },
    {
      $set: {
        type: 'journal_entry',
        agent: 'webapp',
        content,
        entry_datetime: now,
        updated_at: now,
        source: 'webapp_checkin',
        routine_date: routineDate,
      },
      $setOnInsert: { created_at: now },
    },
    { upsert: true }
  );
}

export async function deleteRoutineJournalEntry(routineDate) {
  const client = await clientPromise;
  const db = client.db('PersonalAgent');
  const collection = db.collection('journal');
  await collection.deleteOne({ source: 'webapp_checkin', routine_date: routineDate });
}
