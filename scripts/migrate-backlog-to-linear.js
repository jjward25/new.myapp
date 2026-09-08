/* One-time: migrate Personal.Backlog -> Linear issues.
   Idempotent: writes `linearId` back onto each Backlog doc, skips ones that
   already have it. Personal.Backlog is kept as an archive.

   Run from the repo root (reads .env.local automatically):
     node scripts/migrate-backlog-to-linear.js --limit 5     # a small test first
     node scripts/migrate-backlog-to-linear.js --dry
     node scripts/migrate-backlog-to-linear.js               # the rest
   By default only migrates OPEN (no Complete Date, not Missed) tasks.
   Add --all to include completed/missed too.
*/
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

try {
  for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !line.trimStart().startsWith("#")) {
      const k = line.slice(0, i).trim();
      if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {}

const DRY = process.argv.includes("--dry");
const ALL = process.argv.includes("--all");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i > -1 ? Number(process.argv[i + 1]) : Infinity;
})();

const P = { P0: 1, P1: 2, P2: 3, P3: 4 };

async function gql(query, variables) {
  const r = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { Authorization: process.env.LINEAR_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

(async () => {
  for (const k of ["MONGODB_URI", "LINEAR_API_KEY", "LINEAR_TEAM_ID"]) {
    if (!process.env[k]) throw new Error("missing env " + k);
  }
  const teamId = process.env.LINEAR_TEAM_ID;

  // find the completed-state id once (for already-done tasks)
  const states = (await gql(`query($id:String!){team(id:$id){states{nodes{id type}}}}`, { id: teamId }))
    .team.states.nodes;
  const doneStateId = states.find((s) => s.type === "completed")?.id;

  const mc = new MongoClient(process.env.MONGODB_URI);
  await mc.connect();
  const coll = mc.db("Personal").collection("Backlog");

  const q = { linearId: { $exists: false } };
  if (!ALL) {
    q.$or = [{ "Complete Date": null }, { "Complete Date": "" }, { "Complete Date": { $exists: false } }];
    q.Missed = { $ne: true };
  }
  const docs = (await coll.find(q).toArray()).slice(0, LIMIT === Infinity ? undefined : LIMIT);
  console.log(`${docs.length} tasks to migrate${DRY ? " (dry)" : ""}`);

  let ok = 0;
  for (const d of docs) {
    const input = {
      teamId,
      title: d["Task Name"] || "(untitled)",
      description: d.Notes || "",
      priority: P[String(d.Priority).toUpperCase()] || 0,
    };
    if (d["Due Date"]) input.dueDate = String(d["Due Date"]).slice(0, 10);
    const completed = d["Complete Date"] && d["Complete Date"] !== "";
    if (completed && doneStateId) input.stateId = doneStateId;

    if (DRY) {
      console.log(`  [dry] ${completed ? "✓" : " "} ${input.title}  (${d.Priority || "-"})`);
      ok++;
      continue;
    }
    try {
      const res = await gql(
        `mutation($input:IssueCreateInput!){issueCreate(input:$input){issue{id identifier}}}`,
        { input }
      );
      const issue = res.issueCreate.issue;
      await coll.updateOne({ _id: d._id }, { $set: { linearId: issue.id, linearKey: issue.identifier } });
      ok++;
      if (ok % 20 === 0) console.log(`  ${ok}/${docs.length}`);
      await new Promise((s) => setTimeout(s, 250)); // rate limit
    } catch (e) {
      console.error(`  FAIL "${input.title}":`, e.message);
    }
  }
  console.log(`done — ${ok}/${docs.length}`);
  await mc.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
