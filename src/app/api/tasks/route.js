// src/app/api/tasks/route.js
//
// Backs the center "tasks" pane on /work -- scoped to Linear's "ToDos"
// project only (see src/utils/linear/client.js). Replaced 2026-09-09: this
// used to pull from an older, separate Linear client that queried every
// issue across every project (no project filter, and never set `Project` on
// the returned task, so per-project scoping silently never worked) with a
// Mongo Personal.Backlog fallback. Linear is the single source now, same as
// /api/projects and /api/tasks/by-project.
import { NextResponse } from 'next/server';
import { getToDosTasks, createToDosTask, updateTaskById } from '@/utils/linear/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getToDosTasks());
  } catch (e) {
    console.error('tasks GET', e);
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const item = await req.json();
    const result = await createToDosTask(item);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error('tasks POST', e);
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, updatedItem } = await req.json();
    const success = await updateTaskById(id, updatedItem);
    return NextResponse.json({ ok: success });
  } catch (e) {
    console.error('tasks PATCH', e);
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
