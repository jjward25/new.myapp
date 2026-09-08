// src/utils/gcal.js — Google Calendar via raw REST (no googleapis dep).
// Reuses the SAME OAuth client + refresh token Hermes already has, so the
// webapp and the agent see one calendar.
// Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
//      GOOGLE_CALENDAR_ID (default "primary")

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const calId = () => encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary');
const base = () => `https://www.googleapis.com/calendar/v3/calendars/${calId()}/events`;

let _tok = { value: null, exp: 0 };

export function gcalConfigured() {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
}

async function getAccessToken() {
  if (_tok.value && Date.now() < _tok.exp) return _tok.value;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`gcal token ${res.status}: ${await res.text()}`);
  const d = await res.json();
  _tok = { value: d.access_token, exp: Date.now() + (d.expires_in - 120) * 1000 };
  return _tok.value;
}

// normalize a gcal event -> the webapp's flat shape
function norm(e) {
  const start = e.start?.date || e.start?.dateTime || '';
  return {
    gcalId: e.id,
    title: e.summary || '(no title)',
    date: start.slice(0, 10),
    time: e.start?.dateTime ? start.slice(11, 16) : '',
    description: e.description || '',
    location: e.location || '',
    allDay: !!e.start?.date,
  };
}

export async function listEvents(timeMin, timeMax) {
  const token = await getAccessToken();
  const out = [];
  let pageToken;
  do {
    const p = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      timeMin,
      timeMax,
    });
    if (pageToken) p.set('pageToken', pageToken);
    const res = await fetch(`${base()}?${p}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`gcal list ${res.status}`);
    const d = await res.json();
    (d.items || []).forEach((e) => e.status !== 'cancelled' && out.push(norm(e)));
    pageToken = d.nextPageToken;
  } while (pageToken);
  return out;
}

function bodyFor({ title, date, time, description, location }) {
  const b = { summary: title, description: description || '', location: location || '' };
  const day = String(date).slice(0, 10);
  if (time) {
    b.start = { dateTime: `${day}T${time}:00`, timeZone: 'America/New_York' };
    b.end = { dateTime: `${day}T${time}:00`, timeZone: 'America/New_York' };
  } else {
    b.start = { date: day };
    b.end = { date: day };
  }
  return b;
}

export async function createEvent(evt) {
  const token = await getAccessToken();
  const res = await fetch(base(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyFor(evt)),
  });
  if (!res.ok) throw new Error(`gcal create ${res.status}: ${await res.text()}`);
  return norm(await res.json());
}

export async function patchEvent(gcalId, evt) {
  const token = await getAccessToken();
  const res = await fetch(`${base()}/${gcalId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyFor(evt)),
  });
  if (!res.ok) throw new Error(`gcal patch ${res.status}`);
  return norm(await res.json());
}

export async function removeEvent(gcalId) {
  const token = await getAccessToken();
  const res = await fetch(`${base()}/${gcalId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 410 && res.status !== 404) throw new Error(`gcal delete ${res.status}`);
}
