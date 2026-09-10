// src/app/api/benchmarks/route.js
// The program's mobility benchmarks (passive SLR, pancake, splits, hanging
// SLR, thoracic) -- webapp-owned `benchmarks` collection in the shared DB.
import { getBenchmarks, logBenchmark } from '../../../utils/mongoDB/hermesWorkouts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return new Response(JSON.stringify(await getBenchmarks()), { status: 200 });
  } catch (error) {
    console.error('benchmarks GET', error);
    return new Response(JSON.stringify({ error: 'Unable to fetch benchmarks' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { key, value, note } = await req.json();
    if (!key) return new Response(JSON.stringify({ error: 'key required' }), { status: 400 });
    await logBenchmark(key, value, note);
    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  } catch (error) {
    console.error('benchmarks POST', error);
    return new Response(JSON.stringify({ error: String(error.message || error) }), { status: 500 });
  }
}
