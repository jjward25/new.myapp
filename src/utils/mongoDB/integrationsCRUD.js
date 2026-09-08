// src/utils/mongoDB/integrationsCRUD.js
// One doc per external provider in Personal.Integrations, holding OAuth
// tokens + sync bookkeeping. Server-only.
import clientPromise from './mongoConnect';

const DB = 'Personal';
const COLL = 'Integrations';

export async function getIntegration(id) {
  const client = await clientPromise;
  return client.db(DB).collection(COLL).findOne({ _id: id });
}

export async function saveIntegration(id, data) {
  const client = await clientPromise;
  return client
    .db(DB)
    .collection(COLL)
    .updateOne({ _id: id }, { $set: { ...data, _id: id, updatedAt: new Date().toISOString() } }, { upsert: true });
}
