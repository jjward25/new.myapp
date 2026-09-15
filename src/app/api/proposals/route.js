// src/app/api/proposals/route.js
import { listProposals, setProposalStatus } from '../../../utils/mongoDB/proposalsCRUD';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    return new Response(JSON.stringify(await listProposals(status)), { status: 200 });
  } catch (error) {
    console.error('proposals GET', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch proposals' }), { status: 500 });
  }
}

// Approve/reject only -- never "applies" anything. { id, status }
export async function PATCH(req) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return new Response(JSON.stringify({ error: 'id and status are required' }), { status: 400 });
    }
    await setProposalStatus(id, status);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    console.error('proposals PATCH', error);
    return new Response(JSON.stringify({ error: String(error.message || error) }), { status: 500 });
  }
}
