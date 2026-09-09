/* One-time: move the webapp's data from the "Personal" DB into the shared
   "PersonalAgent" DB (where Hermes lives). Non-destructive — "Personal" is
   left intact as an archive. Idempotent (upsert by _id).

   Run from the repo root (reads .env.local automatically):
     node scripts/migrate-personal-to-personalagent.js --dry
     node scripts/migrate-personal-to-personalagent.js
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
const SRC = "Personal";
const DST = "PersonalAgent";

// straight copy, upsert by _id
const PLAIN = ["Backlog", "Projects", "Lists", "Routines"];

const dayOnly = (d) => (d ? String(d).slice(0, 10) : d);

(async () => {
  if (!process.env.MONGODB_URI) throw new Error("missing MONGODB_URI");
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const src = c.db(SRC);
  const dst = c.db(DST);

  for (const name of PLAIN) {
    const docs = await src.collection(name).find({}).toArray();
    let n = 0;
    for (const d of docs) {
      if (!DRY) await dst.collection(name).updateOne({ _id: d._id }, { $set: d }, { upsert: true });
      n++;
    }
    console.log(`${DRY ? "[dry] " : ""}${name}: ${n} -> ${DST}.${name}`);
  }

  // Calendar — normalize date to YYYY-MM-DD on the way over
  {
    const docs = await src.collection("Calendar").find({}).toArray();
    let n = 0;
    for (const d of docs) {
      const doc = { ...d, date: dayOnly(d.date) };
      if (!DRY) await dst.collection("Calendar").updateOne({ _id: d._id }, { $set: doc }, { upsert: true });
      n++;
    }
    console.log(`${DRY ? "[dry] " : ""}Calendar: ${n} -> ${DST}.Calendar (dates normalized)`);
  }

  // Workouts — one doc holding { Workouts:[...], Templates:{...} }.
  {
    const srcDoc = await src.collection("Workouts").findOne({});
    const dstDoc = await dst.collection("Workouts").findOne({});
    if (!srcDoc) {
      console.log("Workouts: nothing in source");
    } else if (!dstDoc) {
      if (!DRY) await dst.collection("Workouts").insertOne(srcDoc);
      console.log(`${DRY ? "[dry] " : ""}Workouts: copied whole doc (${(srcDoc.Workouts || []).length} entries)`);
    } else {
      const byId = new Map((dstDoc.Workouts || []).map((w) => [String(w._id), w]));
      for (const w of srcDoc.Workouts || []) byId.set(String(w._id), w);
      const merged = [...byId.values()];
      const Templates = dstDoc.Templates || srcDoc.Templates;
      if (!DRY)
        await dst.collection("Workouts").updateOne(
          { _id: dstDoc._id },
          { $set: { Workouts: merged, ...(Templates ? { Templates } : {}) } }
        );
      console.log(`${DRY ? "[dry] " : ""}Workouts: merged -> ${merged.length} entries`);
    }
  }

  console.log("\ndone. `Personal` left intact as an archive.");
  await c.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
