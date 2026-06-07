import { prisma } from "../src/prisma";
import type { RunType } from "../src/runs/constants";

// Seed a realistic training block spanning April–June 2026.
//
//   npm --prefix server run seed            # additive (keeps existing runs)
//   npm --prefix server run seed -- --reset # wipe ALL runs first, then seed
//
// Data is deterministic (fixed RNG seed), so a --reset re-run reproduces the
// same set. Without --reset, re-running appends another copy.

const START = new Date(Date.UTC(2026, 3, 1)); // 2026-04-01
const END = new Date(Date.UTC(2026, 5, 30, 23, 59, 59)); // 2026-06-30
const RACE_DAY = "2026-06-21"; // a Sunday — half marathon replaces the long run

// Small deterministic PRNG (mulberry32) so the dataset is reproducible.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260401);
const rint = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const rfloat = (min: number, max: number) => rand() * (max - min) + min;

interface Profile {
  type: RunType;
  dist: [number, number]; // km range
  pace: [number, number]; // sec/km range
  hour: [number, number]; // start hour range (local UTC)
}

// Weekday → workout. Mon easy, Wed quality (tempo/interval by week), Fri recovery,
// Sun long run. Other days are rest.
const EASY: Profile = { type: "Easy", dist: [5, 8], pace: [315, 345], hour: [6, 8] };
const TEMPO: Profile = { type: "Tempo", dist: [8, 11], pace: [255, 280], hour: [6, 8] };
const INTERVAL: Profile = { type: "Interval", dist: [6, 9], pace: [240, 265], hour: [6, 8] };
const RECOVERY: Profile = { type: "Recovery", dist: [4, 6], pace: [350, 380], hour: [17, 19] };
const LONG: Profile = { type: "Long Run", dist: [16, 26], pace: [300, 330], hour: [7, 9] };
const RACE: Profile = { type: "Race", dist: [21.1, 21.1], pace: [240, 250], hour: [8, 9] };

const NOTES = [
  "Felt strong throughout.",
  "Legs heavy, kept it easy.",
  "Negative split.",
  "Windy out there.",
  "Great weather, smooth run.",
  "A bit tired but pushed through.",
];

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

function profileFor(day: Date, weekIndex: number): Profile | null {
  if (ymd(day) === RACE_DAY) return RACE;
  switch (day.getUTCDay()) {
    case 1:
      return EASY;
    case 3:
      return weekIndex % 3 === 2 ? INTERVAL : TEMPO;
    case 5:
      return RECOVERY;
    case 0:
      return LONG;
    default:
      return null;
  }
}

interface SeedRun {
  distanceKm: number;
  durationSec: number;
  date: Date;
  type: string;
  notes: string | null;
}

function generate(): SeedRun[] {
  const runs: SeedRun[] = [];
  for (
    let day = new Date(START);
    day <= END;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const weekIndex = Math.floor(
      (day.getTime() - START.getTime()) / (7 * 86_400_000),
    );
    const profile = profileFor(day, weekIndex);
    if (!profile) continue;
    // ~8% of scheduled sessions skipped (rest / missed) — except the race.
    if (profile !== RACE && rand() < 0.08) continue;

    const distanceKm = Math.round(rfloat(profile.dist[0], profile.dist[1]) * 10) / 10;
    const paceSec = rfloat(profile.pace[0], profile.pace[1]);
    const durationSec = Math.round(distanceKm * paceSec);
    const date = new Date(
      Date.UTC(
        day.getUTCFullYear(),
        day.getUTCMonth(),
        day.getUTCDate(),
        rint(profile.hour[0], profile.hour[1]),
        rint(0, 59),
      ),
    );
    const notes = rand() < 0.25 ? NOTES[rint(0, NOTES.length - 1)] : null;
    runs.push({ distanceKm, durationSec, date, type: profile.type, notes });
  }
  return runs;
}

async function main() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    const { count } = await prisma.run.deleteMany({});
    console.log(`--reset: removed ${count} existing run(s).`);
  }

  const runs = generate();
  await prisma.run.createMany({ data: runs });

  const byType = runs.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});
  const total = await prisma.run.count();
  console.log(
    `Seeded ${runs.length} runs across ${ymd(START)} → ${ymd(END)}:`,
    byType,
  );
  console.log(`Total runs now in the database: ${total}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
