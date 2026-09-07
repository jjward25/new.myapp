// Structured view of the core fitness program
// (Mongo: PersonalAgent.fitness_program — the ~30KB markdown doc Hermes owns).
// Hand-mirrored here so the /workouts "Program" tab can render it richly
// instead of dumping markdown. Keep in sync when the source doc changes; the
// data-integration phase will read it straight from Atlas.

export const PROGRAM_UPDATED = "2026-09-06";

export const mission = {
  headline: "A body that folds in half, holds any position as long as it wants to, and looks obscene doing it.",
  body: "An exceptionally round, firm, athletic physique with glutes as the centerpiece — plus the flexibility, strength, speed, joint capacity and multidirectional movement of a complete athlete.",
  principle:
    "Not a minimum-effective-dose program. Maximum productive dose — harder is useful when harder produces adaptation. Every extra set has to earn its place by producing progress.",
};

// The weekly rhythm as a chant. Maps to Mon stretch / Wed squeeze / Fri 360 / Sat speed / Sun durability.
export const mantra = ["GO DEEP", "SQUEEZE HARDER", "OPEN EVERY ANGLE", "LAST LONGER", "DON'T TAP OUT"];

export const goalLegend = [
  { key: "ass", emoji: "🍑", label: "ass size / projection", stripe: "#ff78ad" },
  { key: "rom", emoji: "🤸", label: "fold / splits / extreme ROM", stripe: "#9d7cff" },
  { key: "strength", emoji: "💪", label: "strong through huge ROM", stripe: "#65b8ff" },
  { key: "back", emoji: "🪽", label: "complete back / scapula", stripe: "#69d5b1" },
  { key: "power", emoji: "⚡", label: "athletic power / speed", stripe: "#ffd866" },
  { key: "durability", emoji: "🛡️", label: "joint & tissue durability", stripe: "#ffb27d" },
];

export const periodization = [
  {
    phase: "WEEKS 1–2",
    name: "ESTABLISH",
    detail: "Learn the loads. Learn what your recovery can actually take before it complains. Around 18 hard glute sets a week, bottom of every range, nothing to failure yet.",
  },
  {
    phase: "WEEKS 3–5",
    name: "PUSH",
    detail: "The block that builds it. 20–24+ glute sets a week if recovery holds — Bulgarians, thrusts, abduction, deficit lunges, kickbacks. Take the compounds right to the edge. Never trade range for load.",
  },
  {
    phase: "WEEK 6",
    name: "DELOAD",
    detail: "Back off 40–50%. Keep the patterns, keep the full range, keep it moving. Nothing hard. Let it supercompensate, then go again heavier.",
  },
];

export const cyclePull = "More is only better if you can still take all of it.";

export const effortArchitecture = [
  { kind: "Heavy Compounds", rule: "1–2 RIR. Repeated high-quality hard sets, not drop sets. 10 → 9 → 8 with excellent ROM is a win.", list: "Deep Bulgarian · RDL · Hip thrust · Deep squat · ATG split squat · Deficit reverse lunge" },
  { kind: "Stable Isolation", rule: "Periodically 0 RIR / technical failure. Myo-reps and drop sets live here — best stimulus-to-fatigue for burnout.", list: "Hip abduction · Donkey kick · Seated leg curl · Calf / soleus / tibialis" },
  { kind: "Loaded Mobility", rule: "Control → ROM → reps → load. Failure is not the objective.", list: "Cossack · Jefferson curl · 90/90 lift-off · Pike compression" },
];

// tags map to goalLegend keys.
export const week = [
  {
    id: "daily",
    name: "Morning Mobility",
    theme: "GET MORE FLEXIBLE EVERY DAY",
    dayLabel: "DAILY",
    time: "~8 min",
    accent: "#69d5b1",
    payoff: "Keep daily access to the ranges the strength work is building.",
    blocks: [
      {
        label: "Flow through it — never fatiguing",
        exercises: [
          { name: "Elephant Walk", dose: "10/side · 1 easy", tags: ["rom"], why: "Hamstrings / posterior chain + pike prep. Attacks the biggest measured deficit." },
          { name: "90/90 Hip Switch", dose: "3–5/side · 1 easy", tags: ["rom"], why: "Maintain already-good hip internal/external rotation." },
          { name: "ATG Split-Squat Flow", dose: "5/side · 1 easy", tags: ["rom"], why: "Daily deep knee + hip-extension ROM. Don't fatigue the legs." },
          { name: "Segmental Cat-Cow", dose: "5 cycles · very slow", tags: ["rom"], why: "Restore thoracic articulation — a priority skill now, not a warm-up." },
          { name: "Cossack Flow", dose: "5/side · 1 easy", tags: ["rom"], why: "Adductor + lateral hip ROM. Save the hard work for training / night." },
          { name: "Deep Squat Pry", dose: "30 sec · optional", tags: ["rom"], why: "Maintain integrated hip/ankle ROM. Optional — ankle ROM tested well." },
        ],
      },
    ],
  },
  {
    id: "mon",
    name: "Stretch",
    theme: "BIG ROUND ASS + FOLD YOURSELF IN HALF",
    dayLabel: "MON",
    time: "~55–60 min",
    accent: "#ff78ad",
    payoff: "#1 day for overall ass size + forward-fold flexibility. Become brutally strong at long muscle lengths.",
    blocks: [
      {
        label: "Stretch 1",
        exercises: [
          { name: "Deep Deficit Bulgarian", dose: "6–10/leg · 3–4 sets · 1–2 RIR", tags: ["ass", "rom"], why: "Highest-priority ass mass / roundness + extreme loaded glute stretch.", progression: "ROM → reps → set → load" },
          { name: "Weighted Pull-Up", dose: "5–8 · 3 sets · 1–2 RIR", tags: ["back"], why: "Lats / arms + vertical pull. Don't burn out.", progression: "reps → weight" },
          { name: "Squared Front Split (ROM)", dose: "30–60 sec/side · deepest after final Bulgarian", tags: ["rom"], why: "Turn split-stance strength into actual front-split range.", progression: "pelvis-to-floor distance → longer hold" },
        ],
      },
      {
        label: "Stretch 2",
        exercises: [
          { name: "Standard RDL", dose: "6–8 · 3 sets · 1–2 RIR · 3-sec eccentric", tags: ["ass", "rom"], why: "Glute + hamstring long-length hypertrophy.", progression: "hinge ROM → reps → load" },
          { name: "Incline DB Press", dose: "6–10 · 3 sets · 1–2 RIR", tags: ["strength"], why: "Chest / shoulders through a deep controlled bottom.", progression: "deep ROM → reps → load" },
          { name: "Pike → Pike Compression (ROM)", dose: "30–60 sec + 8–15 lifts", tags: ["rom"], why: "Hamstring ROM + active extreme folding. Targets the ~55–60° SLR deficit.", progression: "torso depth → lift height → hands forward" },
        ],
      },
      {
        label: "Stretch 3",
        exercises: [
          { name: "Weighted Cossack", dose: "6–10/side · 2–3 sets · ~2–3 RIR", tags: ["ass", "rom"], why: "Strong adductors at long lengths. ROM quality over fatigue.", progression: "W1–2: 2 → optional 3rd" },
          { name: "Pancake → Middle Split (ROM)", dose: "45–60 sec + 30–45 sec", tags: ["rom"], why: "Directly attack the measured straddle / middle-split deficit. No bouncing." },
        ],
      },
      {
        label: "Stretch 4",
        exercises: [
          { name: "Jefferson Curl", dose: "6 slow · 2 light sets", tags: ["rom"], why: "Loaded spinal-flexion control, especially deficient thoracic flexion. Articulation is the KPI, not depth." },
        ],
      },
    ],
  },
  {
    id: "wed",
    name: "Squeeze",
    theme: "MAKE THE ASS POP",
    dayLabel: "WED",
    time: "~55 min",
    accent: "#9d7cff",
    payoff: "#1 day for shape — upper shelf, outer ass, projection. Glute contraction + targeted failure.",
    blocks: [
      {
        label: "Anchor",
        exercises: [
          { name: "Hip Thrust", dose: "6–10 · 3–4 sets · 1–2 RIR, final 0–1", tags: ["ass"], why: "Maximum-contraction glute hypertrophy + projection. 2-sec squeeze.", progression: "add Push set → reps → load" },
          { name: "Hip Abduction", dose: "12–20 · 2–3 sets + final myo-rep matching", tags: ["ass"], why: "Upper / outer shelf + side-ass hypertrophy. Designated burnout.", progression: "technical failure → 15–20 sec → mini-sets" },
        ],
      },
      {
        label: "Squeeze 1",
        exercises: [
          { name: "ATG Split Squat", dose: "6–8/leg · 1–2 sets · ~2–3 RIR", tags: ["strength", "rom"], why: "Extreme-ROM knee/hip strength + loaded rear-hip opening.", progression: "ROM → control → modest load" },
          { name: "DB Overhead Press", dose: "6–10 · 3 sets · 1–2 RIR", tags: ["strength"], why: "Vertical push + shoulder strength through full overhead ROM.", progression: "reps → load" },
        ],
      },
      {
        label: "Squeeze 2",
        exercises: [
          { name: "Seated Leg Curl", dose: "8–12 · 2–3 sets · final may reach myo", tags: ["ass"], why: "Hamstring knee-flexion hypertrophy. Good place for local failure." },
          { name: "Chest-Supported Row", dose: "8–12 · 3 sets · 1–2 RIR", tags: ["back"], why: "Mid-back / rear delt / scapular development. Full scapular excursion." },
        ],
      },
      {
        label: "Squeeze 3",
        exercises: [
          { name: "Hanging Straight-Leg Raise", dose: "6–10 · 2–3 controlled · ~1–2 RIR", tags: ["rom"], why: "Active compression + abs / hip flexors. ROM over rep count.", progression: "~50–60° → 90° → above 90° → toes-to-bar" },
          { name: "Copenhagen Plank", dose: "20–30 sec/side · 2 controlled", tags: ["durability"], why: "Adductor / groin strength + lateral durability. Crisp, not failure." },
        ],
      },
    ],
  },
  {
    id: "fri",
    name: "360",
    theme: "ASS FROM EVERY ANGLE + PUT YOUR LEGS ANYWHERE",
    dayLabel: "FRI",
    time: "~55–60 min",
    accent: "#65b8ff",
    payoff: "Cover the ranges Mon / Wed don't. Deep + multidirectional hypertrophy and active ROM.",
    blocks: [
      {
        label: "Anchor",
        exercises: [
          { name: "Deep Squat", dose: "5–8 · 3 sets · 1–2 RIR", tags: ["ass", "rom"], why: "Deep integrated glute + quad hypertrophy. Keep depth as load rises.", progression: "depth → reps → load" },
        ],
      },
      {
        label: "360 · 1",
        exercises: [
          { name: "Deficit Reverse Lunge", dose: "8–10/leg · 2–3 sets · 1–2 RIR", tags: ["ass", "rom"], why: "Unilateral glute shape + long-length hypertrophy. Major Push-phase volume lever.", progression: "add 3rd set → deficit/depth → reps/load" },
          { name: "DB Bench Press", dose: "8–12 · 3 sets · 1–2 RIR", tags: ["strength"], why: "Horizontal push through a deep controlled stretch." },
        ],
      },
      {
        label: "360 · 2",
        exercises: [
          { name: "Glute-Biased 45° Back Extension", dose: "10–15 · 2 sets · 1–2 RIR", tags: ["ass"], why: "Additional glute-max / posterior hypertrophy. Don't hyperextend the lumbar spine." },
          { name: "Pull-Up / Pulldown", dose: "8–12 · 3 sets · 1–2 RIR", tags: ["back"], why: "Vertical pull / lats from a full overhead stretch." },
        ],
      },
      {
        label: "360 · 3",
        exercises: [
          { name: "MonkeyFoot Donkey Kick", dose: "12–20/side · 2–3 sets · final 0 RIR + optional drop", tags: ["ass"], why: "Pure glute-max isolation + projection. Designated burnout." },
          { name: "Middle-Split Hold", dose: "30–45 sec · 2 controlled", tags: ["rom"], why: "Actual middle-split specificity. Replaces 90/90 lift-offs.", progression: "measure pelvis-to-floor → time / depth" },
        ],
      },
      {
        label: "360 · 4",
        exercises: [
          { name: "Jefferson Curl", dose: "6 slow · 2 light", tags: ["rom"], why: "Spinal-flexion strength + thoracic articulation. Never failure." },
          { name: "Pike Compression", dose: "8–15 · 2 controlled", tags: ["rom"], why: "Second weekly hard active-compression exposure. Don't lean back to fake height." },
          { name: "Pancake", dose: "45–60 sec · 2 controlled", tags: ["rom"], why: "Adductor length + wide-leg compression. Pairs with Middle Split." },
        ],
      },
    ],
  },
  {
    id: "sat",
    name: "Speed / Cardio",
    theme: "MAKE THE BODY PERFORM LIKE IT LOOKS",
    dayLabel: "SAT",
    time: "~40 min",
    accent: "#ffd866",
    payoff: "High-speed application of the strength you've built. Your true max-effort day.",
    blocks: [
      {
        label: "The session",
        exercises: [
          { name: "Dynamic Sprint Warm-Up", dose: "~8 min · 1 sequence", tags: ["power"], why: "Jog → leg swings → ATG lunges → A-skips → progressive accelerations. No hard static stretching." },
          { name: "400m Sprint", dose: "400m @ ~85–90% · 4 reps", tags: ["power", "ass"], why: "Explosive glutes / hamstrings + athletic conditioning. Tall, relaxed, powerful.", progression: "faster / repeatable 400s before adding intervals" },
          { name: "Walk Recovery", dose: "200m after each 400", tags: ["power"], why: "Walk until you can reproduce quality. Don't turn good sprints into sloppy jogging." },
          { name: "Zone 2 (optional)", dose: "10–20 min", tags: ["durability"], why: "Aerobic base / recovery. Skip if recovery is poor." },
        ],
      },
    ],
  },
  {
    id: "sun",
    name: "Durability",
    theme: "BUILD THE PARTS THAT KEEP THE BADDIE RUNNING",
    dayLabel: "SUN",
    time: "~40 min",
    accent: "#ffb27d",
    payoff: "Train the small structures that keep the whole system working. Stay healthy, complete the physique.",
    blocks: [
      {
        label: "Durability 1–2",
        exercises: [
          { name: "Single-Leg Calf Raise", dose: "10–15/side · 2 sets · 1–2 RIR", tags: ["durability"], why: "Gastroc + ankle / Achilles durability." },
          { name: "DB External Rotation", dose: "10–15/side · 2 sets · 2–3 RIR", tags: ["durability"], why: "Rotator cuff. Very light, never failure." },
          { name: "Bent-Knee Soleus Raise", dose: "12–20 · 2 sets · 1–2 RIR", tags: ["durability"], why: "Soleus + sprint / deceleration durability." },
          { name: "Trap-3 / Prone Y Raise", dose: "8–12 · 2 sets · 2–3 RIR", tags: ["back"], why: "Lower trap / scapular control. Home-friendly." },
        ],
      },
      {
        label: "Durability 3–4",
        exercises: [
          { name: "Tibialis Raise", dose: "15–25 · 2 sets · 0–2 RIR", tags: ["durability"], why: "Anterior shin / dorsiflexion capacity. Don't chase junk volume." },
          { name: "Med-Ball Rotation / Cable Chop", dose: "8–12/side · 2 crisp", tags: ["power"], why: "Rotational strength / power. Never sloppy failure." },
          { name: "Pallof Press", dose: "8–12/side · 2 sets", tags: ["durability"], why: "Anti-rotation. Complements the rotation work." },
        ],
      },
      {
        label: "Durability 5",
        exercises: [
          { name: "Suitcase Carry", dose: "30–60 sec/side · 2 challenging", tags: ["durability"], why: "Lateral core + grip + shoulder stability. High-return movement." },
          { name: "Dead / Towel Hang", dose: "30–60 sec · 1–2 sets", tags: ["strength"], why: "Grip / forearms + overhead tolerance. Low systemic fatigue." },
        ],
      },
    ],
  },
];

export const eveningRecovery = {
  frame: "Nightly routine = acquire ROM often. Strength program = make that ROM strong and usable.",
  items: [
    { name: "Segmental Cat-Cow", dose: "5 very slow cycles", purpose: "Teach the thoracic spine to actually flex — round from the upper back, not the lumbar." },
    { name: "Elephant Walk → Pike", dose: "10 reps → 45–60 sec hold", purpose: "~55–60° straight-leg raise makes posterior-chain length priority #1." },
    { name: "Pike Compression", dose: "2 × 8–12", purpose: "Turn new hamstring ROM into active compression. Don't lean the torso back." },
    { name: "Cossack Flow → Pancake", dose: "5/side → 45–60 sec", purpose: "Adductor length + wide-leg hip flexion. Attack the limited straddle." },
    { name: "Middle-Split Hold", dose: "2 × 30–45 sec", purpose: "Specific practice for the actual skill. Support with hands / blocks." },
    { name: "Squared Front Split", dose: "30–45 sec/side", purpose: "Honest front-split exposure — hips squared, not chasing apparent depth." },
  ],
};

export const designMatrix = {
  columns: ["Strong Short", "Strong Long", "Enter Extreme ROM", "Stable There", "Move Fast"],
  note: "If all five columns are covered for a region, stop adding exercises unless you're deliberately prioritizing hypertrophy.",
  rows: [
    { region: "🍑 Glutes", cells: ["Thrust / donkey", "Bulgarian / SLDL", "Deep Bulgarian / pistol", "Unilateral work", "Sprint / jump"] },
    { region: "Hamstrings", cells: ["Leg curl if needed", "SLDL", "Straight-leg hip flexion", "SLDL / unilateral", "Sprint"] },
    { region: "Hip flexors", cells: ["MF high-knee if needed", "Split / hip extension", "HSLR / high-knee", "Pistol / compression", "Sprint"] },
    { region: "Adductors", cells: ["Direct only if needed", "Cossack", "Pancake / middle split", "Cossack", "Lateral athletics"] },
    { region: "Quads / RF", cells: ["Squat / sissy", "Sissy / Reverse Nordic", "Deep squat / pistol", "Unilateral", "Jump / sprint"] },
    { region: "Chest", cells: ["Cable fly / press", "Deep fly / press", "Controlled deep ROM", "Press", "Chest throw"] },
    { region: "🪽 Back / scapula", cells: ["Rows / pulls", "Full-ROM row / hang", "Full scapular excursion", "Carries / compounds", "Muscle snatch"] },
    { region: "Spine / trunk", cells: ["Extension force", "Jefferson flexion", "Segmental fold", "Carry / anti-motion", "Rotation / throws"] },
    { region: "Shoulders", cells: ["Raises / press", "Deep press / overhead", "Full-ROM raise / snatch", "Cuff", "Muscle snatch"] },
    { region: "🦿 Calf / ankle", cells: ["Calf raise", "Deep calf ROM", "Tib + ankle ROM", "Unilateral", "Sprint / jump"] },
  ],
};

export const benchmarks = [
  { name: "Passive straight-leg raise", now: "~55–60°", pct: 62, target: "→ past 90°. knee to your own face, no hands." },
  { name: "Pancake", now: 'elbows ~3" up', pct: 34, target: "→ chest flat to the floor, legs as wide as they'll go." },
  { name: "Middle split", now: '~18" off the floor', pct: 28, target: "→ flat, hips square, comfortable enough to hold a conversation." },
  { name: "Squared front split", now: "needs a clean retest", pct: 20, target: "→ all the way down, both sides, no wobble, no wince." },
  { name: "Hanging straight-leg raise", now: "88°", pct: 92, hit: true, target: "✓ basically 90°. next: toes to the bar, slow, no swing — pure control." },
];

export const endState = [
  { emoji: "🍑", text: "Maximum productive glute development" },
  { emoji: "↔️", text: "Mobile in every direction" },
  { emoji: "💪", text: "Strong throughout enormous ROM" },
  { emoji: "⚡", text: "Fast and explosive" },
  { emoji: "🦶", text: "Durable from the ground up" },
  { emoji: "🌀", text: "Strong outside the sagittal plane" },
  { emoji: "🦾", text: "Healthy shoulders and scapular mechanics" },
  { emoji: "🤸", text: "Exceptional active and passive flexibility" },
];
