// Shared signed-cookie helpers for the icon-puzzle login (middleware.ts +
// api/login/route.js). Built on Web Crypto (`crypto.subtle`) deliberately —
// middleware always runs on the Edge runtime, which only has Web Crypto, not
// Node's `crypto` module. Using the same API in the API route (Node runtime,
// but `crypto.subtle` is globally available there too on Node 20+) keeps
// signing/verification identical in both places instead of maintaining two
// implementations that could drift apart.

const encoder = new TextEncoder();

async function getKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Sign an arbitrary string payload -> "payload.signature", both base64url.
export async function signPayload(payload, secret) {
  const key = await getKey(secret);
  const sigBytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  return `${toBase64Url(encoder.encode(payload))}.${toBase64Url(sigBytes)}`;
}

// Verify "payload.signature" -> the original payload string, or null if
// missing/malformed/tampered.
export async function verifySignedValue(value, secret) {
  if (!value || typeof value !== "string" || !value.includes(".")) return null;
  const [payloadB64, sigB64] = value.split(".");
  if (!payloadB64 || !sigB64) return null;

  let payload, sigBytes;
  try {
    payload = new TextDecoder().decode(fromBase64Url(payloadB64));
    sigBytes = fromBase64Url(sigB64);
  } catch {
    return null;
  }

  const key = await getKey(secret);
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
  return valid ? payload : null;
}

// Constant-time-ish string comparison — used for the override secret (the
// actual master key: unlike the puzzle answer, which never leaves the
// server, this one gets typed into a request body and deserves the same
// care as comparing a real password hash). A plain `===` short-circuits on
// the first differing character, which leaks (via timing) how many leading
// characters matched — usually academic, but cheap to avoid here.
export function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const maxLen = Math.max(a.length, b.length);
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= ca ^ cb;
  }
  return mismatch === 0;
}

export const SESSION_COOKIE = "site_session";

// Lockout policy: once MAX_ATTEMPTS wrong guesses from one IP land inside
// one WINDOW_MS sliding window, that IP is rejected outright — without even
// checking the submitted answer — until the window elapses. Tracked
// server-side in Mongo by IP (src/utils/mongoDB/loginAttempts.js), not in a
// cookie — a cookie-based version was tried first and found to be trivially
// bypassable by simply not sending the cookie back.
//
// Lowered 5 -> 3 on 2026-09-07: the puzzle is now 3 steps (icon, icon
// again, colour order) = 16 x 16 x 6 = 1536 combinations, so a legitimate
// owner who knows the answer effectively never fumbles it 3x, and a tighter
// per-IP cap means the "use a backup code" path surfaces sooner.
export const MAX_ATTEMPTS = 3;

// Every non-success response from /api/login (wrong puzzle answer, wrong
// backup code, or a lockout rejection) is held for this long before
// returning. A fixed server-side delay is the cheapest possible brute-force
// brake: it caps guess throughput per connection regardless of how fast the
// attacker's client is, and it's applied after the lockout gate so the
// number of delayed invocations is itself bounded (MAX_ATTEMPTS per IP +
// GLOBAL_MAX_ATTEMPTS across all sources, per window). Kept modest so a
// burst of junk requests can't pin serverless concurrency for long.
export const FAILURE_DELAY_MS = 1500;

// GLOBAL_MAX_ATTEMPTS covers the gap MAX_ATTEMPTS alone can't: a client
// can't spoof its IP on Vercel (confirmed against Vercel's own docs — they
// overwrite x-forwarded-for and don't relay a client-supplied value), but a
// real attacker can still spread guesses across many genuinely different
// real IPs (rotating proxies, VPN exit nodes, a cheap IPv6 block), each
// staying under MAX_ATTEMPTS individually. This counts failures across every
// source combined in the same window — set well above what one legitimate,
// fumbling owner could rack up from a single IP (which caps at
// MAX_ATTEMPTS=5 anyway) but low enough to actually stop a distributed
// attempt before it clears the puzzle's 96-combination space (16 icons x 3!
// orderings, after the icon grid was widened the same day).
export const GLOBAL_MAX_ATTEMPTS = 20;
export const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
