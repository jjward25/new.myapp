// src/app/api/tasks/route.js — Linear-backed task API.
// Falls back to Personal.Backlog when Linear isn't configured, so the home
// board + KPIs keep working either way. Returns the app's task shape.
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { linearConfigured, listIssues, createIssue, updateIssue } from '@/utils/linear';
import { getBacklog, addItem, updateItem } from '@/utils/mongoDB/taskCRUD';
import { getWeekBoundsEST } from '@/utils/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope'); // "open-week" | "done-week" | null

  if (linearConfigured()) {
    try {
      const week = getWeekBoundsEST(new Date());
      if (scope === 'done-week') {
        const all = await listIssues({ completed: true, first: 100 });
        return NextResponse.json(all.filter((t) => t['Complete Date'] >= week.start && t['Complete Date'] <= week.end));
      }
      if (scope === 'open-week') {
        return NextResponse.json(await listIssues({ completed: false, dueBefore: week.end, first: 100 }));
      }
      return NextResponse.json(await listIssues({ first: 100 }));
    } catch (e) {
      console.error('tasks GET (linear)', e);
      // fall through to Mongo
    }
  }

  // Mongo fallback
  const backlog = await getBacklog();
  const list = (Array.isArray(backlog) ? backlog : []).map((t) => ({ ...t, _id: String(t._id) }));
  return NextResponse.json(list);
}

export async function POST(req) {
  const item = await req.json();
  if (linearConfigured()) {
    try {
      const issue = await createIssue({
        title: item['Task Name'],
        description: item.Notes || '',
        priority: item.Priority || 'P1',
        dueDate: item['Due Date'] || null,
      });
      return NextResponse.json(issue, { status: 201 });
    } catch (e) {
      console.error('tasks POST (linear)', e);
    }
  }
  item._id = new ObjectId();
  const result = await addItem(item);
  return NextResponse.json({ ok: true, result }, { status: 201 });
}

export async function PATCH(req) {
  const { id, updatedItem } = await req.json();
  if (linearConfigured() && !ObjectId.isValid(id)) {
    try {
      return NextResponse.json(await updateIssue(id, updatedItem));
    } catch (e) {
      console.error('tasks PATCH (linear)', e);
      return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
    }
  }
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  const result = await updateItem(new ObjectId(id), updatedItem);
  return NextResponse.json({ ok: true, result });
}
