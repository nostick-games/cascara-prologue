import { creatureTypeProfile } from "../data/creatureTypes.js";

function levelIndex(level) {
  return Math.max(0, Math.min(2, (level ?? 1) - 1));
}

export function typeStatusForCreature(enemy) {
  return creatureTypeProfile(enemy.type)?.status ?? null;
}

export function typeStatusChance(enemy) {
  if (typeof enemy.typeStatusChanceOverride === "number") {
    return enemy.typeStatusChanceOverride;
  }

  const status = typeStatusForCreature(enemy);
  if (!status) return 0;

  return status.chanceByLevel[levelIndex(enemy.level)] ?? status.chanceByLevel[0];
}

export function typeStatusIntensity(enemy) {
  const status = typeStatusForCreature(enemy);
  if (!status) return 0;

  return status.intensityByLevel[levelIndex(enemy.level)] ?? status.intensityByLevel[0];
}
