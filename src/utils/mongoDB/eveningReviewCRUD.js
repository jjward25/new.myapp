// src/utils/mongoDB/eveningReviewCRUD.js
//
// Reads/writes the Evening Review surface -- `evening_reviews` (one doc/night)
// and `pending_memory_updates` (individual memory/task proposals), both
// written by Hermes' evening_review_cron.py (no_agent, ~20:00 ET). No agent
// writes to `memories` mid-conversation anymore -- this is the human-review
// gate the whole 2026-09-15 memory-architecture redesign exists to build.
//
// One real constraint shapes this file: the webapp (Vercel) has no
// filesystem access to the laptop, so it can never touch memories/USER.md or
// memories/.history/ directly. Confirming/reverting a USER.md diff and
// clearing old snapshots are therefore RECORDED here (a status field on the
// evening_reviews doc) and ACTED ON by evening_review_cron.py's next run,
// which does have filesystem access. This file only ever writes intent.
import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';
import { createToDosTask } from '../linear/client';
import { createEvent } from '../gcal';

const db = async () => (await clientPromise).db('PersonalAgent');

function proposalOut(d) {
  return {
    id: String(d._id),
    type: d.type,
    content: d.content,
    category: d.category,
    source: d.source,
    // task-only: which system this is headed to on approval. Added
    // 2026-09-15 -- "play basketball at 5:30pm" had been going to Linear
    // (open-ended todos) when it's a scheduled event and belongs on the
    // calendar; evening_review_cron.py now classifies by whether a specific
    // date/time was mentioned, not just "this is time-bound."
    destination: d.destination || null,
    eventDate: d.event_date || null,
    eventTime: d.event_time || null,
    relatedMemoryId: d.related_memory_id || null,
    relatedMemoryPreview: d.related_memory_preview || null,
    status: d.status,
    createdAt: d.created_at,
    reviewDate: d.review_date,
  };
}

export async function getLatestEveningReview() {
  const c = (await db()).collection('evening_reviews');
  const doc = await c.find({}).sort({ date: -1 }).limit(1).next();
  if (!doc) return null;
  return {
    id: String(doc._id),
    date: doc.date,
    userMdDiff: doc.user_md_diff || '',
    userMdStatus: doc.user_md_status || 'pending', // 'pending' | 'confirmed' | 'revert_requested'
    hasJournalToday: !!doc.has_journal_today,
    tomorrowEvents: doc.tomorrow_events || [],
    tomorrowTasks: doc.tomorrow_tasks || {},
    status: doc.status || 'pending', // 'pending' | 'reviewed'
  };
}

// Every currently-pending proposal, not scoped to one night -- an unreviewed
// evening rolls forward rather than disappearing, by design.
export async function getPendingMemoryProposals() {
  const c = (await db()).collection('pending_memory_updates');
  const docs = await c.find({ status: 'pending' }).sort({ created_at: 1 }).toArray();
  return docs.map(proposalOut);
}

export async function getActiveMemories() {
  const c = (await db()).collection('memories');
  const docs = await c
    .find({ type: 'memory', status: 'active' })
    .sort({ created_at: -1 })
    .toArray();
  return docs.map((d) => ({ id: String(d._id), content: d.content, category: d.category }));
}

// Same normalization dedup rule as memory_create's redirect
// (plugins/mongodb/__init__.py) and evening_review_cron.py -- kept in sync
// deliberately, not shared code, since this is JS and those are Python.
function normalize(text) {
  return String(text || '').trim().toLowerCase().replace(/[.!?\s]+$/, '');
}

// asSupersede: when true and the proposal carries related_memory_id, the
// existing memory is marked superseded (never deleted) and this becomes its
// replacement -- the schema's existing supersedes_memory_id/
// superseded_by_memory_id mechanism, same one memory_update already used.
// Embedding is computed here, not at proposal-create time (deferred exactly
// as documented in _memory_create's 2026-09-15 comment) -- pending proposals
// are never hybrid-searched, only active memories are.
export async function approveMemoryProposal(id, { asSupersede = false } = {}) {
  const database = await db();
  const pending = database.collection('pending_memory_updates');
  const memories = database.collection('memories');

  const doc = await pending.findOne({ _id: new ObjectId(id) });
  if (!doc) throw new Error('Proposal not found.');
  if (doc.status !== 'pending') throw new Error(`Proposal already ${doc.status}.`);

  const now = new Date();

  if (doc.type === 'memory') {
    if (await memories.findOne({ content: doc.content, status: 'active' })) {
      // Landed as active some other way since this was proposed (e.g. a
      // duplicate explicit ask that got approved first) -- don't duplicate.
      await pending.updateOne({ _id: doc._id }, { $set: { status: 'applied', reviewed_at: now } });
      return { applied: false, reason: 'already_active' };
    }

    const newDoc = {
      type: 'memory',
      agent: 'default',
      content: doc.content,
      category: doc.category || 'general',
      scope: doc.scope || 'personal',
      status: 'active',
      supersedes_memory_id: asSupersede && doc.related_memory_id ? doc.related_memory_id : null,
      superseded_by_memory_id: null,
      created_at: now,
      updated_at: now,
    };
    // Embedding computed via Ollama would need the webapp to reach the
    // laptop's local model, which it can't. Leaving it unembedded is a real
    // tradeoff (this memory won't surface via semantic search until it gets
    // an embedding some other way) but never blocks the write -- same
    // fail-open principle as safe_embed_text's existing None-on-failure
    // behavior in plugins/mongodb/__init__.py. Lexical (Atlas Search) search
    // still finds it either way.
    const inserted = await memories.insertOne(newDoc);

    if (asSupersede && doc.related_memory_id) {
      await memories.updateOne(
        { _id: new ObjectId(doc.related_memory_id) },
        { $set: { status: 'superseded', superseded_by_memory_id: String(inserted.insertedId), updated_at: now } }
      );
    }

    await pending.updateOne({ _id: doc._id }, { $set: { status: 'applied', reviewed_at: now } });
    return { applied: true, memoryId: String(inserted.insertedId) };
  }

  if (doc.type === 'task') {
    if (doc.destination === 'calendar' && doc.event_date) {
      const event = await createEvent({ title: doc.content, date: doc.event_date, time: doc.event_time || '' });
      await pending.updateOne({ _id: doc._id }, { $set: { status: 'applied', reviewed_at: now } });
      return { applied: true, gcalId: event?.gcalId || null };
    }
    const result = await createToDosTask({ 'Task Name': doc.content, Priority: 'P2' });
    await pending.updateOne({ _id: doc._id }, { $set: { status: 'applied', reviewed_at: now } });
    return { applied: true, linearIssueId: result?.issue?.id || null };
  }

  throw new Error(`Unknown proposal type: ${doc.type}`);
}

export async function rejectMemoryProposal(id) {
  const c = (await db()).collection('pending_memory_updates');
  const now = new Date();
  const result = await c.updateOne(
    { _id: new ObjectId(id), status: 'pending' },
    { $set: { status: 'rejected', reviewed_at: now } }
  );
  if (result.matchedCount === 0) throw new Error('Proposal not found or already reviewed.');
  return { rejected: true };
}

// For a task proposal whose related_memory_id flags "this duplicates an
// active memory saved before the memory/task distinction existed" (see
// evening_review_cron.py's conflicts_with_memory) -- a separate, explicit
// action from approving the task itself, since the two intents (create the
// task / retire the stale memory) are independent and the user should
// control each.
export async function retireMemory(memoryId) {
  const c = (await db()).collection('memories');
  const now = new Date();
  const result = await c.updateOne(
    { _id: new ObjectId(memoryId), status: 'active' },
    {
      $set: {
        status: 'retired',
        retired_at: now,
        retired_reason: 'retired via Evening Review -- flagged as duplicating a task proposal',
      },
    }
  );
  if (result.matchedCount === 0) throw new Error('Memory not found or not active.');
  return { retired: true };
}

// Records intent only -- see file header. evening_review_cron.py's next run
// reads this and does the actual file restore/prune.
export async function setUserMdStatus(reviewId, status) {
  if (!['confirmed', 'revert_requested'].includes(status)) {
    throw new Error(`Invalid user_md status: ${status}`);
  }
  const c = (await db()).collection('evening_reviews');
  await c.updateOne({ _id: new ObjectId(reviewId) }, { $set: { user_md_status: status, updated_at: new Date() } });
  return { ok: true };
}

// No LLM draft (removed 2026-09-15 -- user doesn't want a pre-written
// entry). This just saves whatever the user typed, same shape
// journal_create_entry's handler writes (plugins/mongodb/__init__.py), so
// it's indistinguishable from one written interactively.
export async function saveJournalEntry(reviewId, content) {
  const database = await db();
  const reviews = database.collection('evening_reviews');
  const now = new Date();

  const finalContent = String(content || '').trim();
  if (!finalContent) throw new Error('content cannot be empty.');
  await database.collection('journal').insertOne({
    type: 'journal_entry',
    agent: 'default',
    content: finalContent,
    entry_datetime: now,
    created_at: now,
    updated_at: now,
  });
  await reviews.updateOne({ _id: new ObjectId(reviewId) }, { $set: { has_journal_today: true } });
  return { saved: true };
}

// The one "done for tonight" action -- does NOT require every proposal to be
// resolved first (unresolved ones roll forward to the next review, by
// design). Marks the night reviewed so evening_review_cron.py's next run
// knows it's safe to act on any recorded user_md intent and prune history.
export async function markReviewComplete(reviewId) {
  const c = (await db()).collection('evening_reviews');
  await c.updateOne({ _id: new ObjectId(reviewId) }, { $set: { status: 'reviewed', reviewed_at: new Date() } });
  return { ok: true };
}
