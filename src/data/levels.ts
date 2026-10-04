import { WorldKey, worlds } from "@/theme/theme";

// 30 levels across 3 worlds. Thresholds are cumulative points required to REACH that level.
// Values follow the spec's examples (L1:0, L2:50, L3:120 ... L10:500, L11:550 ... L20:1500, L21:1600 ... L30:3000)
// and interpolate the levels the spec didn't spell out, with a gentle acceleration per world.
function buildWorldThresholds(startLevel: number, endLevel: number, startPts: number, endPts: number) {
  const count = endLevel - startLevel;
  const out: number[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    // ease-in curve so later levels in a world take a bit more
    const eased = Math.pow(t, 1.15);
    out.push(Math.round(startPts + (endPts - startPts) * eased));
  }
  return out;
}

const starter = buildWorldThresholds(1, 10, 0, 500);
const balanced = buildWorldThresholds(11, 20, 550, 1500);
const independent = buildWorldThresholds(21, 30, 1600, 3000);

export const LEVEL_THRESHOLDS: number[] = [...starter, ...balanced, ...independent];
// index 0 -> level 1 threshold, ... index 29 -> level 30 threshold

export function worldForLevel(level: number): WorldKey {
  if (level <= 10) return "starter";
  if (level <= 20) return "balanced";
  return "independent";
}

export function levelForPoints(points: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, 30);
}

export function progressToNextLevel(points: number) {
  const level = levelForPoints(points);
  if (level >= 30) {
    return { level, world: worldForLevel(level), pointsIntoLevel: points, pointsForNext: 0, progress: 1, isMax: true };
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level];
  const pointsIntoLevel = points - currentThreshold;
  const pointsForNext = nextThreshold - currentThreshold;
  return {
    level,
    world: worldForLevel(level),
    pointsIntoLevel,
    pointsForNext,
    progress: pointsForNext > 0 ? pointsIntoLevel / pointsForNext : 1,
    isMax: false,
  };
}

export function worldMeta(key: WorldKey) {
  return worlds[key];
}
