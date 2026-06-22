import { statDefinitions } from "./stats.js";

const playerRadarUnlockedStats = new Set(["power", "defense", "vitality", "crit", "speed"]);

export const playerRadarStatDefinitions = statDefinitions.map((stat) => ({
  ...stat,
  locked: !playerRadarUnlockedStats.has(stat.id)
}));

export function playerRadarAllocatableStatIds() {
  return playerRadarStatDefinitions
    .filter((stat) => !stat.locked)
    .map((stat) => stat.id);
}
