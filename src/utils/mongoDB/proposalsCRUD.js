// src/utils/mongoDB/proposalsCRUD.js
//
// Site-change proposals -- Hermes' propose_site_change tool writes here
// (plugins/mongodb/__init__.py) when a chat request needs a code/config
// change it has no tool to make directly. Deliberately inert: nothing here
// or in Hermes applies a change automatically. Approve/reject just updates
// status; a human (or a separate coding session) does the actual edit.
import clientPromise from './mongoConnect';
import { ObjectId } from 'mongodb';

const col = async () => (await clientPromise).db('PersonalAgent').collection('pending_site_changes');

export async function listProposals(status) {
  const c = await col();
  const q = { type: 'site_change_proposal' };
  if (status) q.status = status;
  const docs = await c.find(q).sort({ created_at: -1 }).toArray();
  return docs.map((d) => ({
    id: String(d._id),
    description: d.description,
    rationale: d.rationale || '',
    area: d.area || '',
    status: d.status,
    createdAt: d.created_at,
  }));
}

export async function setProposalStatus(id, status) {
  if (!['pending', 'approved', 'rejected', 'applied'].includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  const c = await col();
  const result = await c.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updated_at: new Date() } }
  );
  return result;
}
