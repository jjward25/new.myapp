// src/utils/mongoDB/pairedDevicesCRUD.js
//
// Part C device pairing (proposal-worker-pipeline.md): Coder mode and
// content_edit both require a paired-device cookie in addition to the
// normal site session. Pairing itself only requires being logged in
// already (same login gate as everything else on this site) — it is a
// device-scoped lease, NOT a second auth factor. What it actually buys:
// an attacker with only the login credential still can't reach
// file-editing tools without also pairing a device, and pairing a new
// device is itself a signal worth alerting on (see notifyDevicePaired,
// wired once the Signal gateway platform is linked).
//
// Capped at MAX_DEVICES (3 — 2 laptops + phone, per direction). Pairing a
// 4th is blocked outright until one of the existing 3 is revoked, so
// swapping devices is a deliberate, visible action, never something that
// silently accumulates.
import clientPromise from './mongoConnect';
import crypto from 'crypto';

const DB_NAME = 'Personal';
const COLLECTION = 'PairedDevices';

export const MAX_DEVICES = 3;

async function getCollection() {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION);
  await collection.createIndex({ deviceId: 1 }, { unique: true }).catch(() => {});
  return collection;
}

// secretHash, never the raw secret, is what's stored -- the signed cookie
// itself carries the raw secret (see deviceAuth.js), same split as a
// password vs. its hash. Losing this collection to a read-only leak
// (e.g. a misconfigured backup) shouldn't hand over live device secrets.
function hashSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export async function listDevices() {
  const c = await getCollection();
  const docs = await c.find({ revokedAt: { $exists: false } }).sort({ pairedAt: 1 }).toArray();
  return docs.map((d) => ({
    deviceId: d.deviceId,
    label: d.label,
    pairedAt: d.pairedAt,
    lastSeenAt: d.lastSeenAt || null,
  }));
}

export async function countActiveDevices() {
  const c = await getCollection();
  return c.countDocuments({ revokedAt: { $exists: false } });
}

// Returns { deviceId, secret } -- secret is returned exactly once, at
// pairing time, and never stored in plaintext. Caller signs it into the
// device_pair cookie immediately; if that's lost, the device must be
// re-paired (no recovery -- this mirrors how a session secret works).
export async function registerDevice(label) {
  const active = await countActiveDevices();
  if (active >= MAX_DEVICES) {
    throw new Error(
      `Device cap reached (${MAX_DEVICES}). Revoke an existing device before pairing a new one.`
    );
  }
  const deviceId = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString('base64url');
  const c = await getCollection();
  await c.insertOne({
    deviceId,
    label: (label || 'Unnamed device').slice(0, 80),
    secretHash: hashSecret(secret),
    pairedAt: new Date(),
    lastSeenAt: null,
  });
  return { deviceId, secret };
}

// Validates a (deviceId, secret) pair against the live, non-revoked
// record. Touches lastSeenAt on success (best-effort -- failure to record
// it never blocks the actual request).
export async function verifyDevice(deviceId, secret) {
  if (!deviceId || !secret) return false;
  const c = await getCollection();
  const doc = await c.findOne({ deviceId, revokedAt: { $exists: false } });
  if (!doc) return false;
  const ok = doc.secretHash === hashSecret(secret);
  if (ok) {
    c.updateOne({ deviceId }, { $set: { lastSeenAt: new Date() } }).catch(() => {});
  }
  return ok;
}

export async function revokeDevice(deviceId) {
  const c = await getCollection();
  const result = await c.updateOne(
    { deviceId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}
