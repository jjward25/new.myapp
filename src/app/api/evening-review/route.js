// src/app/api/evening-review/route.js
//
// Direct Mongo/Linear read-write for the Evening Review surface -- no agent,
// no Tailscale, same direct-lane pattern as /api/roundup and /api/proposals.
// GET returns the latest review doc + every currently-pending proposal +
// current active memories (for the UI to render relatedness context).
// POST takes one { action, ... } body per user action -- approve/reject a
// proposal, retire a conflicting memory, set USER.md intent, save a journal
// entry, or mark the night reviewed.
import {
  getLatestEveningReview,
  getPendingMemoryProposals,
  getActiveMemories,
  approveMemoryProposal,
  rejectMemoryProposal,
  retireMemory,
  setUserMdStatus,
  saveJournalEntry,
  markReviewComplete,
} from '../../../utils/mongoDB/eveningReviewCRUD';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [review, proposals, activeMemories] = await Promise.all([
      getLatestEveningReview(),
      getPendingMemoryProposals(),
      getActiveMemories(),
    ]);
    return new Response(JSON.stringify({ review, proposals, activeMemories }), { status: 200 });
  } catch (error) {
    console.error('evening-review GET', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch evening review' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'approve_proposal':
        return ok(await approveMemoryProposal(body.id, { asSupersede: !!body.asSupersede }));
      case 'reject_proposal':
        return ok(await rejectMemoryProposal(body.id));
      case 'retire_memory':
        return ok(await retireMemory(body.memoryId));
      case 'set_user_md_status':
        return ok(await setUserMdStatus(body.reviewId, body.status));
      case 'save_journal':
        return ok(await saveJournalEntry(body.reviewId, body.content));
      case 'mark_review_complete':
        return ok(await markReviewComplete(body.reviewId));
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400 });
    }
  } catch (error) {
    console.error('evening-review POST', error);
    return new Response(JSON.stringify({ error: String(error.message || error) }), { status: 500 });
  }
}

function ok(result) {
  return new Response(JSON.stringify(result), { status: 200 });
}
