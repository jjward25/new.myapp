// Server-side lockout for /login. One global counter, no per-IP tier: once
// MAX_ATTEMPTS well-formed wrong answers land inside a single WINDOW_MS
// window — from ANY source, combined — the whole login is locked until the
// window elapses. Only the backup code (LOGIN_OVERRIDE_SECRET) works during
// a lockout.
//
// Why global-only on a single-user site: the owner knows the answer and
// keeps the backup code in a password manager, so a hard global lock costs
// the owner one click. In exchange, a distributed guessing attack (many
// IPs, each staying just under a per-IP cap) is structurally impossible —
// there is no per-IP cap to stay under, every wrong guess counts against
// the same 3.
//
// Tracked in Mongo, not a cookie — a cookie-based counter was found live to
// be trivially bypassable by simply not sending the cookie back.
import clientPromise from "./mongoConnect"
import { WINDOW_MS } from "@/utils/loginAuth"

const DB_NAME = "Personal"
const COLLECTION = "LoginAttempts"
const GLOBAL_ID = "__global__"

async function getCollection() {
  const client = await clientPromise
  const collection = client.db(DB_NAME).collection(COLLECTION)
  // Idempotent — safe to call every request. TTL index is hygiene only (so
  // the collection doesn't grow forever); the windowStart check below is
  // what actually enforces the lockout.
  await collection.createIndex({ windowStart: 1 }, { expireAfterSeconds: 24 * 60 * 60 }).catch(() => {})
  return collection
}

export async function getAttempts() {
  const collection = await getCollection()
  const doc = await collection.findOne({ _id: GLOBAL_ID })
  if (!doc) return { count: 0, windowStart: 0 }
  return { count: doc.count, windowStart: doc.windowStart }
}

// `previous` is whatever getAttempts() already returned in the caller —
// passed in rather than re-read here to avoid a redundant query and a
// window for a lost update between the two.
export async function recordFailedAttempt(previous) {
  const collection = await getCollection()
  const now = Date.now()
  const withinWindow = now - previous.windowStart < WINDOW_MS
  const next = withinWindow
    ? { count: previous.count + 1, windowStart: previous.windowStart || now }
    : { count: 1, windowStart: now }
  await collection.updateOne(
    { _id: GLOBAL_ID },
    { $set: { count: next.count, windowStart: next.windowStart } },
    { upsert: true }
  )
  return next
}

// Cleared on any successful login (puzzle or backup code). On a single-user
// site a real login means the coast is clear — don't leave a stale failure
// count sitting there to lock the owner out on their next fumble.
export async function clearAttempts() {
  const collection = await getCollection()
  await collection.deleteOne({ _id: GLOBAL_ID })
}
