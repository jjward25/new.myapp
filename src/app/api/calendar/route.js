// src/app/api/calendar/route.js
// Google Calendar is the source of truth when configured; Personal.Calendar
// is a write-through cache + fallback. The Calendar component's contract
// (flat {_id,title,date,description,location}) is unchanged.
import { ObjectId } from 'mongodb';
import { getCalendarEvents, addEvent, updateEvent, deleteEvent } from '../../../utils/mongoDB/calendarCRUD';
import clientPromise from '@/utils/mongoDB/mongoConnect';
import { gcalConfigured, listEvents, createEvent, patchEvent, removeEvent } from '@/utils/gcal';

export const dynamic = 'force-dynamic';

const cache = async () => (await clientPromise).db('Personal').collection('Calendar');
const dayOnly = (d) => (d ? String(d).slice(0, 10) : '');

export async function GET(req) {
  try {
    const mongoEvents = await getCalendarEvents();

    if (!gcalConfigured()) {
      return Response.json(mongoEvents.map((e) => ({ ...e, date: dayOnly(e.date) })));
    }

    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 1).toISOString();
    const g = await listEvents(timeMin, timeMax);
    const gIds = new Set(g.map((e) => e.gcalId));
    const gKey = new Set(g.map((e) => `${e.title}|${e.date}`));

    // gcal events first; keep any mongo-only events not represented in gcal
    const merged = [
      ...g.map((e) => ({ ...e, _id: e.gcalId })),
      ...mongoEvents
        .filter((e) => !(e.gcalId && gIds.has(e.gcalId)) && !gKey.has(`${e.title}|${dayOnly(e.date)}`))
        .map((e) => ({ ...e, _id: String(e._id), date: dayOnly(e.date) })),
    ];
    return Response.json(merged);
  } catch (error) {
    console.error('calendar GET', error);
    // fall back to cache
    try {
      const mongoEvents = await getCalendarEvents();
      return Response.json(mongoEvents.map((e) => ({ ...e, _id: String(e._id), date: dayOnly(e.date) })));
    } catch {
      return Response.json({ error: 'Unable to fetch calendar' }, { status: 500 });
    }
  }
}

export async function POST(req) {
  try {
    const item = await req.json();
    item.date = dayOnly(item.date);
    let gcalId = null;
    if (gcalConfigured()) {
      const g = await createEvent(item);
      gcalId = g.gcalId;
    }
    const mongoDoc = { ...item, _id: new ObjectId(), ...(gcalId ? { gcalId } : {}) };
    await addEvent(mongoDoc);
    return Response.json({ ok: true, gcalId }, { status: 201 });
  } catch (error) {
    console.error('calendar POST', error);
    return Response.json({ error: 'Unable to add event' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, updatedItem } = await req.json();
    updatedItem.date = dayOnly(updatedItem.date);

    if (ObjectId.isValid(id) && String(new ObjectId(id)) === String(id)) {
      const c = await cache();
      const doc = await c.findOne({ _id: new ObjectId(id) });
      if (doc?.gcalId && gcalConfigured()) await patchEvent(doc.gcalId, { ...doc, ...updatedItem });
      await updateEvent(id, updatedItem);
    } else if (gcalConfigured()) {
      // id is a gcal event id
      await patchEvent(id, updatedItem);
      const c = await cache();
      await c.updateOne({ gcalId: id }, { $set: { ...updatedItem, gcalId: id } }, { upsert: true });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('calendar PUT', error);
    return Response.json({ error: 'Unable to update event' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (ObjectId.isValid(id) && String(new ObjectId(id)) === String(id)) {
      const c = await cache();
      const doc = await c.findOne({ _id: new ObjectId(id) });
      if (doc?.gcalId && gcalConfigured()) await removeEvent(doc.gcalId);
      await deleteEvent(new ObjectId(id));
    } else if (gcalConfigured()) {
      await removeEvent(id);
      const c = await cache();
      await c.deleteOne({ gcalId: id });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('calendar DELETE', error);
    return Response.json({ error: 'Unable to delete event' }, { status: 500 });
  }
}
