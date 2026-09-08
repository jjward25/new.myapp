/* One-time: push Personal.Calendar events that aren't in Google Calendar
   up to GCal, then treat GCal as source of truth.

   Run from the repo root (reads .env.local automatically):
     node scripts/migrate-calendar-to-gcal.js          # do it
     node scripts/migrate-calendar-to-gcal.js --dry    # preview only
*/
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

// load .env.local
try {
  const envPath = path.join(process.cwd(), ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !line.trimStart().startsWith("#")) {
      const k = line.slice(0, i).trim();
      if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {}

const DRY = process.argv.includes("--dry");
const CAL = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");
const BASE = `https://www.googleapis.com/calendar/v3/calendars/${CAL}/events`;

async function token() {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error("token " + r.status + " " + (await r.text()));
  return (await r.json()).access_token;
}

async function listAll(tok) {
  const out = [];
  let pageToken;
  do {
    const p = new URLSearchParams({ singleEvents: "true", maxResults: "2500" });
    if (pageToken) p.set("pageToken", pageToken);
    const r = await fetch(`${BASE}?${p}`, { headers: { Authorization: `Bearer ${tok}` } });
    const d = await r.json();
    (d.items || []).forEach((e) => out.push(e));
    pageToken = d.nextPageToken;
  } while (pageToken);
  return out;
}

(async () => {
  for (const k of ["MONGODB_URI", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"]) {
    if (!process.env[k]) throw new Error("missing env " + k);
  }
  const tok = await token();
  const existing = await listAll(tok);
  const seen = new Set(existing.map((e) => `${e.summary}|${(e.start?.date || e.start?.dateTime || "").slice(0, 10)}`));
  console.log(`gcal has ${existing.length} events`);

  const mc = new MongoClient(process.env.MONGODB_URI);
  await mc.connect();
  const coll = mc.db("Personal").collection("Calendar");
  const docs = await coll.find({}).toArray();

  let created = 0,
    skipped = 0;
  for (const doc of docs) {
    if (doc.gcalId) { skipped++; continue; }
    const day = String(doc.date || "").slice(0, 10);
    if (!doc.title || !day) { skipped++; continue; }
    if (seen.has(`${doc.title}|${day}`)) { skipped++; continue; }
    console.log(`${DRY ? "[dry] " : ""}create: ${day}  ${doc.title}`);
    if (DRY) { created++; continue; }
    const r = await fetch(BASE, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: doc.title,
        description: doc.description || "",
        location: doc.location || "",
        start: { date: day },
        end: { date: day },
      }),
    });
    if (!r.ok) { console.error("  fail", r.status, await r.text()); continue; }
    const g = await r.json();
    await coll.updateOne({ _id: doc._id }, { $set: { gcalId: g.id } });
    created++;
    await new Promise((s) => setTimeout(s, 120)); // be gentle
  }
  console.log(`done — created ${created}, skipped ${skipped}`);
  await mc.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
