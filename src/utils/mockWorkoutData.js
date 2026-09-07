// TEMP mock dataset for the Legacy /workouts page so it can be looked at
// without the live (drifted) Mongo data that currently crashes
// pastWorkoutWrap. Not the real schema work — see the roadmap's "Workout
// schema reconciliation" entry for the actual rebuild plan.
//
// Toggle: set NEXT_PUBLIC_WORKOUTS_MOCK=0 to fall back to real Mongo data.
// Consumed by src/app/workouts/page.js and the GET handlers of
// /api/workouts and /api/workouts/templates.

import workoutsJson from "../../Personal.Workouts.json";

export const USE_MOCK_WORKOUTS = process.env.NEXT_PUBLIC_WORKOUTS_MOCK !== "0";

// Reuse the real Day_A..Day_D template definitions already committed in the
// repo — the components use these to group exercises by Morning/Evening and
// to build the progression-chart filters.
export const mockTemplates = workoutsJson.Templates;

const DAY_NAMES = {
  A: "Heavy Upper",
  B: "Back and Hips",
  C: "Leg Day",
  D: "Maintenance + Mobility",
};

// exercise -> [startingWeight, addedPerSession, topSetReps]
// Weight 0 = bodyweight. Reps taper 0/-1/-2 across the 3 sets.
const PROGRESSION = {
  // Day A
  "Lean-forward Dips": [0, 0, 9],
  "DB Military Press": [35, 1, 10],
  "DB Pullover": [45, 1, 8],
  "Pull Ups": [0, 0, 7],
  "Laying Side Shoulder Raise": [15, 0.5, 12],
  // Day B
  "DB Rows": [60, 2, 8],
  "DB Deficit Deadlifts": [75, 3, 7],
  "Split Squats": [30, 1.5, 9],
  "MonkeyFoot Hamstring Curl": [25, 1, 11],
  "MonkeyFoot Glute Kick": [20, 1, 12],
  // Day C
  "Sissy Squats": [0, 0, 9],
  "RDLs (Front and Side)": [55, 2, 10],
  "Zercher Squat": [65, 3, 8],
  "Military Press": [50, 1.5, 10],
  "Seated Front DB Raises": [15, 0.5, 12],
  // Day D
  "Deep Squat Hold + Press": [20, 0.5, 10],
  "Cossack Squats": [15, 0.5, 12],
  "Banded Glute Bridge March": [0, 0, 20],
  "Calf Raises": [0, 0, 25],
  "Dead Bugs": [0, 0, 15],
};

// Which exercises each mock session logs (a realistic subset of the template).
const SESSION_EXERCISES = {
  A: ["Lean-forward Dips", "DB Military Press", "DB Pullover", "Pull Ups", "Laying Side Shoulder Raise"],
  B: ["DB Rows", "DB Deficit Deadlifts", "Split Squats", "MonkeyFoot Hamstring Curl", "MonkeyFoot Glute Kick"],
  C: ["Sissy Squats", "RDLs (Front and Side)", "Zercher Squat", "Military Press", "Seated Front DB Raises"],
  D: ["Deep Squat Hold + Press", "Cossack Squats", "Banded Glute Bridge March", "Calf Raises", "Dead Bugs"],
};

const COMPOUND = new Set([
  "DB Military Press", "DB Pullover", "Pull Ups", "DB Rows", "DB Deficit Deadlifts",
  "Split Squats", "RDLs (Front and Side)", "Zercher Squat", "Military Press", "Lean-forward Dips",
]);

// Build ~5 weeks of sessions ending a couple days before "now": A,B,C then
// A,B,D, repeating, roughly every 2-3 days. sessionIndex drives progression.
const CYCLE = ["A", "B", "C", "A", "B", "D"];
const GAP_DAYS = [2, 2, 3, 2, 2, 3];

function isoDate(d) {
  return d.toISOString().split("T")[0];
}

function buildSets(exercise, sessionIndex) {
  const [start, step, topReps] = PROGRESSION[exercise] || [0, 0, 10];
  const weight = Math.round((start + step * sessionIndex) * 2) / 2; // nearest 0.5
  return [0, 1, 2].map((i) => ({
    SetNumber: i + 1,
    Reps: Math.max(1, topReps - i),
    Weight: weight,
  }));
}

export const mockWorkouts = (() => {
  const out = [];
  const TOTAL = 15;
  // Walk backwards from an anchor date so the newest session is recent.
  const anchor = new Date("2026-09-05T00:00:00Z");
  let cursor = new Date(anchor);
  for (let n = 0; n < TOTAL; n++) {
    const slot = (TOTAL - 1 - n) % CYCLE.length;
    const day = CYCLE[slot];
    const sessionIndex = TOTAL - 1 - n; // 0 = oldest
    const exercises = {};
    for (const ex of SESSION_EXERCISES[day]) {
      exercises[ex] = {
        ExerciseType: COMPOUND.has(ex) ? "Compound" : "Isolation",
        Sets: buildSets(ex, sessionIndex),
      };
    }
    out.push({
      _id: `mock-${String(n).padStart(2, "0")}`,
      Date: isoDate(cursor),
      Day: day,
      WorkoutName: DAY_NAMES[day],
      Exercises: exercises,
    });
    cursor = new Date(cursor.getTime() - GAP_DAYS[slot] * 86400000);
  }
  // out[0] is the most recent session (n=0 used the anchor date); the page
  // re-sorts anyway.
  return out;
})();
