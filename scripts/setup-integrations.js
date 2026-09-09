/* Populate .env.local for the GCal / Linear / Apple-Health integrations by
   reading the credentials Hermes already has. Secrets go file -> file; they
   are never printed in full and never leave this machine.

   Run from the repo root:
     node scripts/setup-integrations.js
     node scripts/setup-integrations.js --dry          # show what it would write
     node scripts/setup-integrations.js --hermes "C:/path/to/Hermes"
     node scripts/setup-integrations.js --linear-key lin_api_xxx   # if the toml can't be found

   Then run the printed `vercel env add` commands to mirror to production.
*/
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const flag = (n) => {
  const i = args.indexOf(n);
  return i > -1 ? args[i + 1] : null;
};

const ENV_PATH = path.join(process.cwd(), ".env.local");
const LINEAR_TEAM_KEY = flag("--team") || "JDU";

const mask = (v) => (v ? v.slice(0, 4) + "…" + v.slice(-4) + ` (${v.length} chars)` : "(none)");

// ---- locate Hermes ----
function findHermes() {
  const cand = [
    flag("--hermes"),
    path.join(process.cwd(), "..", "0.Agents", "Hermes"),
    path.join(os.homedir(), "Desktop", "Coding", "0.Agents", "Hermes"),
    path.join(os.homedir(), "OneDrive", "Desktop", "Coding", "0.Agents", "Hermes"),
  ].filter(Boolean);
  for (const c of cand) if (fs.existsSync(path.join(c, "google_token.json"))) return c;
  return null;
}

// ---- google ----
function readGoogle(hermesDir) {
  if (!hermesDir) return {};
  const d = JSON.parse(fs.readFileSync(path.join(hermesDir, "google_token.json"), "utf8"));
  if (!d.refresh_token) throw new Error("google_token.json has no refresh_token — re-auth Hermes's Google first");
  return {
    GOOGLE_CLIENT_ID: d.client_id,
    GOOGLE_CLIENT_SECRET: d.client_secret,
    GOOGLE_REFRESH_TOKEN: d.refresh_token,
    GOOGLE_CALENDAR_ID: "primary",
  };
}

// ---- linear ----
function readLinearKey() {
  if (flag("--linear-key")) return flag("--linear-key");
  if (process.env.LINEAR_API_KEY) return process.env.LINEAR_API_KEY;
  const tomlPaths = [
    path.join(os.homedir(), "AppData", "Roaming", "linear", "credentials.toml"),
    path.join(os.homedir(), ".config", "linear", "credentials.toml"),
    path.join(os.homedir(), "Library", "Application Support", "linear", "credentials.toml"),
  ];
  for (const p of tomlPaths) {
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, "utf8");
    const m =
      txt.match(/(?:api[_-]?key|apiKey|token|key)\s*=\s*["']?([A-Za-z0-9_\-.]{20,})["']?/i) ||
      txt.match(/(lin_api_[A-Za-z0-9]+)/);
    if (m) return m[1];
  }
  return null;
}

async function resolveTeamId(apiKey) {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query($k:String!){ teams(filter:{key:{eq:$k}}){ nodes{ id key name } } }`,
      variables: { k: LINEAR_TEAM_KEY },
    }),
  });
  const j = await res.json();
  if (j.errors) throw new Error("Linear API: " + JSON.stringify(j.errors));
  const t = j.data.teams.nodes[0];
  if (!t) throw new Error(`No Linear team with key "${LINEAR_TEAM_KEY}" — pass --team <KEY>`);
  console.log(`  Linear team: ${t.name} (${t.key}) -> ${t.id}`);
  return t.id;
}

// ---- write .env.local ----
function applyEnv(updates) {
  let lines = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/) : [];
  for (const [k, v] of Object.entries(updates)) {
    if (v == null || v === "") continue;
    const idx = lines.findIndex((l) => l.startsWith(k + "="));
    if (idx > -1) lines[idx] = `${k}=${v}`;
    else lines.push(`${k}=${v}`);
  }
  if (!DRY) fs.writeFileSync(ENV_PATH, lines.join("\n"));
}

(async () => {
  const hermes = findHermes();
  console.log(hermes ? `Hermes: ${hermes}` : "Hermes not found — skipping Google (pass --hermes <dir>)");

  const updates = {};
  Object.assign(updates, readGoogle(hermes));

  const linearKey = readLinearKey();
  if (linearKey) {
    updates.LINEAR_API_KEY = linearKey;
    updates.LINEAR_TEAM_ID = await resolveTeamId(linearKey);
  } else {
    console.log("Linear key not found — pass --linear-key <lin_api_…> (from linear.app/settings/api)");
  }

  updates.HEALTH_INGEST_TOKEN = crypto.randomBytes(24).toString("base64url");

  console.log("\n" + (DRY ? "[dry] would write:" : "wrote to .env.local:"));
  for (const [k, v] of Object.entries(updates)) console.log(`  ${k} = ${mask(v)}`);

  applyEnv(updates);

  console.log("\nMirror to Vercel (run these; each pauses for the value — paste it):");
  for (const k of Object.keys(updates)) {
    console.log(`  vercel env add ${k} production`);
  }
  console.log("\n(or add them in the Vercel dashboard → Settings → Environment Variables)");
})().catch((e) => {
  console.error("\nERROR:", e.message);
  process.exit(1);
});
