import { NextResponse } from 'next/server';
import { exchangeCode } from '@/utils/strava';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error || !code) {
    return NextResponse.redirect(`${url.origin}/?strava=denied`);
  }
  try {
    await exchangeCode(code);
    // kick a first sync, don't block on it
    fetch(`${url.origin}/api/strava/sync`, { method: 'POST' }).catch(() => {});
    return NextResponse.redirect(`${url.origin}/?strava=connected`);
  } catch (e) {
    console.error('strava callback', e);
    return NextResponse.redirect(`${url.origin}/?strava=error`);
  }
}
