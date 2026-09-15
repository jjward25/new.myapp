// src/utils/deviceAuth.js
//
// Signs/verifies the device_pair cookie -- same HMAC pattern as the site
// session cookie (loginAuth.js), reused rather than re-implemented so both
// stay in lockstep and get the same review scrutiny. Kept as its own file
// (not folded into loginAuth.js) because it's a distinct trust boundary:
// the session cookie proves "logged in", this one additionally proves
// "on a device that went through the one-time pairing flow" -- Coder mode
// and content_edit require BOTH, checked independently.
import { signPayload, verifySignedValue } from "@/utils/loginAuth";
import { verifyDevice } from "@/utils/mongoDB/pairedDevicesCRUD";

export const DEVICE_COOKIE = "device_pair";
export const DEVICE_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // ~1 year

// Payload is "deviceId:secret" -- both needed to verify against the stored
// secretHash (pairedDevicesCRUD.verifyDevice). Signing binds them together
// so one can't be swapped independently of the other.
export async function signDeviceCookie(deviceId, secret, hmacSecret) {
  return signPayload(`${deviceId}:${secret}`, hmacSecret);
}

// Returns { deviceId, secret } or null if the cookie is missing, malformed,
// or its signature doesn't verify (tampered / signed with a different key
// after a secret rotation).
export async function verifyDeviceCookie(cookieValue, hmacSecret) {
  const payload = await verifySignedValue(cookieValue, hmacSecret);
  if (!payload || !payload.includes(":")) return null;
  const idx = payload.indexOf(":");
  const deviceId = payload.slice(0, idx);
  const secret = payload.slice(idx + 1);
  if (!deviceId || !secret) return null;
  return { deviceId, secret };
}

// The single check every Coder-mode / content_edit API route should call
// before doing anything: reads the device_pair cookie off the request,
// verifies its signature, then confirms that device is still active
// (non-revoked) in Mongo. Missing cookie, bad signature, or a revoked
// device all fail the same way -- the caller doesn't need to distinguish
// them, just refuse.
//
// This runs IN ADDITION to the site-wide session check middleware.ts
// already does for every /api/* route -- never a substitute for it.
export async function requireDevicePairing(req) {
  const hmacSecret = process.env.LOGIN_COOKIE_SECRET;
  if (!hmacSecret) return false;
  const raw = req.cookies?.get?.(DEVICE_COOKIE)?.value;
  if (!raw) return false;
  const verified = await verifyDeviceCookie(raw, hmacSecret);
  if (!verified) return false;
  return verifyDevice(verified.deviceId, verified.secret);
}
