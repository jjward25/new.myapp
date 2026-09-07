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

// Lockout policy (single-user site): once MAX_ATTEMPTS well-formed wrong
// answers land inside one WINDOW_MS window — counted GLOBALLY, every source
// combined, NOT per-IP — the whole login is rejected outright, without even
// checking the submitted answer, until the window elapses. Only the backup
// code (LOGIN_OVERRIDE_SECRET) gets in during a lockout.
//
// 3, global, deliberately tight: the owner is the only legitimate user,
// knows the answer, and keeps the backup code in a password manager — so a
// hard lock costs the owner one click. In return, distributed guessing
// (many IPs, each under a per-IP cap) is impossible because there is no
// per-IP cap — every wrong guess anywhere spends one of the same 3.
// Tracked server-side in Mongo (src/utils/mongoDB/loginAttempts.js), not a
// cookie — a cookie counter was found live to be bypassable by simply not
// sending the cookie back.
export const MAX_ATTEMPTS = 3;

// Every non-success response from /api/login (wrong puzzle answer, wrong
// backup code, or a lockout rejection) is held this long before returning —
// the cheapest brute-force brake there is: it caps guess throughput per
// connection regardless of client speed. Only well-formed submissions get
// this far (malformed ones 400 immediately without counting), so the number
// of delayed invocations per window is bounded by MAX_ATTEMPTS. Kept modest
// so a burst of junk can't pin serverless concurrency for long.
export const FAILURE_DELAY_MS = 1500;

export const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
