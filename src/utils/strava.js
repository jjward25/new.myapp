// src/utils/strava.js — Strava OAuth + activity fetch.
// Requires env: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
import { getIntegration, saveIntegration } from './mongoDB/integrationsCRUD';

const TOKEN_URL = 'https://www.strava.com/oauth/token';
const API = 'https://www.strava.com/api/v3';

export function stravaConfigured() {
  return !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
}

export function authorizeUrl(redirectUri) {
  const p = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
  });
  return `https://www.strava.com/oauth/authorize?${p}`;
}

export async function exchangeCode(code) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`strava token exchange ${res.status}`);
  const d = await res.json();
  await saveIntegration('strava', {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: d.expires_at, // epoch seconds
    athlete_id: d.athlete?.id ?? null,
    connectedAt: new Date().toISOString(),
    lastSyncAt: null,
  });
  return d;
}

async function getValidToken() {
  const it = await getIntegration('strava');
  if (!it) throw new Error('strava not connected');
  const now = Math.floor(Date.now() / 1000);
  if (it.expires_at && it.expires_at > now + 120) return it.access_token;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: it.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`strava refresh ${res.status}`);
  const d = await res.json();
  await saveIntegration('strava', {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: d.expires_at,
  });
  return d.access_token;
}

export async function fetchActivities(afterEpoch) {
  const token = await getValidToken();
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const p = new URLSearchParams({ per_page: '100', page: String(page) });
    if (afterEpoch) p.set('after', String(afterEpoch));
    const res = await fetch(`${API}/athlete/activities?${p}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`strava activities ${res.status}`);
    const batch = await res.json();
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}
