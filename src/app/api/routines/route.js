// app/api/routines/route.js

import { ObjectId } from 'mongodb';
import { getBacklog, addRoutine, updateItem, deleteItem, getRoutineById } from '../../../utils/mongoDB/routinesCRUD';
import { upsertRoutineJournalEntry, deleteRoutineJournalEntry } from '../../../utils/mongoDB/journalCRUD';

export const dynamic = 'force-dynamic';

// The Daily Check-In's Journal field mirrors into Hermes' own `journal`
// collection (see journalCRUD.js) so entries written here and entries
// written via chat land in the same searchable place. Routines.Journal
// itself stays as-is -- the weekly habit-tracking counts (isRoutineComplete,
// Pass eligibility, the routines trend chart) key off it and that's a
// separate concern from where the actual journal *content* lives.
async function syncJournalMirror(date, journalValue) {
  if (!date) return;
  const hasRealEntry = typeof journalValue === 'string' && journalValue.trim() !== '' && journalValue !== 'Pass';
  if (hasRealEntry) {
    await upsertRoutineJournalEntry(date, journalValue.trim());
  } else {
    // Cleared, or set to "Pass" -- no real content, drop any mirrored entry.
    await deleteRoutineJournalEntry(date);
  }
}

export async function PUT(req) {
  try {
    const { id, updatedItem } = await req.json();
    const objectId = new ObjectId(id);
    const result = await updateItem(objectId, updatedItem);
    if (Object.prototype.hasOwnProperty.call(updatedItem, 'Journal')) {
      await syncJournalMirror(updatedItem.Date, updatedItem.Journal);
    }
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error updating routine:', error);
    return new Response(JSON.stringify({ error: 'Unable to update routine' }), { status: 500 });
  }
}

export async function GET(req, res) {
  try {
    const backlog = await getBacklog();
    return new Response(JSON.stringify(backlog), { status: 200 });
  } catch (error) {
    console.error('Error fetching backlog:', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch backlog' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const newRoutine = await req.json();
    const result = await addRoutine(newRoutine);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error adding new routine:', error);
    return new Response(JSON.stringify({ error: 'Unable to add new routine' }), { status: 500 });
  }
}

export async function DELETE(req, res) {
  try {
    const { id } = await req.json();
    const objectId = new ObjectId(id);
    const routine = await getRoutineById(objectId);
    const result = await deleteItem(objectId);
    if (routine?.Date) {
      await deleteRoutineJournalEntry(routine.Date);
    }
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error deleting item:', error);
    return new Response(JSON.stringify({ error: 'Unable to delete item' }), { status: 500 });
  }
}
