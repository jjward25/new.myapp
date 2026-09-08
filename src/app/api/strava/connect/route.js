import { NextResponse } from 'next/server';
import { authorizeUrl, stravaConfigured } from '@/utils/strava';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!stravaConfigured()) {
    return NextResponse.json({ error: 'STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET not set' }, { status: 501 });
  }
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(authorizeUrl(`${origin}/api/strava/callback`));
}
