// Server-side (not client-cookie-based) tracking for the /login lockout.
//
// Real bug found and fixed 2026-09-07: the first version of this tracked
// failed attempts in a signed cookie. Signing prevented *tampering* with the
// cookie's value, but not *omitting* it — a client (curl, a script, anything
// that doesn't bother persisting cookies) could just not send it back, and
// every request would start fresh at count=0. Verified live: after tripping
// a real lockout with a cookie-jar-based curl session, a plain request with
// no cookies at all sailed through with zero throttling. Fixed by moving the
// counter here, keyed by IP address in Mongo — something the client cannot
// simply choose not to send, unlike a cookie.
//
// Per-IP tracking alone still has a real, structural gap: an attacker doesn't
// need to spoof anything (Vercel overwrites x-forwarded-for and won't relay
// a client-supplied value — confirmed against Vercel's own docs, not
// assumed) — they can just make requests from many genuinely different real
// IPs (rotating proxies, VPN exit nodes, a cheap IPv6 block). Each looks
// like a fresh identity to a purely per-IP scheme. The GLOBAL counter below
// (one shared record, not keyed by IP) catches that case: it counts failures
// across *all* sources combined, so a distributed attacker still trips a
// site-wide lockout even though no single IP of theirs ever crosses the
// per-IP threshold on its own.
import clientPromise from "./mongoConnect"
import { WINDOW_MS } from "@/utils/loginAuth"

const DB_NAME = "Personal"
const COLLECTION = "LoginAttempts"
const GLOBAL_ID = "__global__"

async function getCollection() {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(COLLECTION)
  // Idempotent — safe to call on every request. TTL index auto-cleans old
  // records; not itself security-critical (the windowStart check in
  // route.js enforces the actual lockout), just hygiene so this collection
  // doesn't grow forever.
  await collection.createIndex({ windowStart: 1 }, { expireAfterSeconds: 24 * 60 * 60 }).catch(() => {})
  return collection
}

async function getRecord(collection, id) {
  const doc = await collection.findOne({ _id: id })
  if (!doc) return { count: 0, windowStart: 0 }
  return { count: doc.count, windowStart: doc.windowStart }
}

async function recordFailure(collection, id, previous) {
  const now = Date.now()
  const withinWindow = now - previous.windowStart < WINDOW_MS
  const next = withinWindow
    ? { count: previous.count + 1, windowStart: previous.windowStart || now }
    : { count: 1, windowStart: now }
  await collection.updateOne(
    { _id: id },
    { $set: { count: next.count, windowStart: next.windowStart } },
    { upsert: true }
  )
  return next
}

export async function getAttempts(ip) {
  const collection = await getCollection()
  return getRecord(collection, ip)
}

export async function getGlobalAttempts() {
  const collection = await getCollection()
  return getRecord(collection, GLOBAL_ID)
}

// `previous`/`previousGlobal` are whatever getAttempts()/getGlobalAttempts()
// already returned in the caller — passed in rather than re-fetched here to
// avoid redundant reads and a window for a lost update between queries.
export async function recordFailedAttempt(ip, previous, previousGlobal) {
  const collection = await getCollection()
  const next = await recordFailure(collection, ip, previous)
  const nextGlobal = await recordFailure(collection, GLOBAL_ID, previousGlobal)
  return { next, nextGlobal }
}

// Clears only this IP's own record. Deliberately does NOT touch the global
// counter — a successful login from one IP (including via the override
// backdoor) shouldn't reset protection against an ongoing attack spread
// across other IPs.
export async function clearAttempts(ip) {
  const collection = await getCollection()
  await collection.deleteOne({ _id: ip })
}
