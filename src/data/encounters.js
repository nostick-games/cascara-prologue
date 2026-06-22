import { selectRandomAffixForType } from "./affixes.js";
import { creatures } from "./creatures.js";
import { mapEncounterPools } from "./mapEncounterPools.js";

export const captureEncounterPool = [
  {
    id: "capture_braise_corne",
    creatureKey: "braiseCorne",
    challenge: {
      targetLevel: 1,
      scalingMode: "match_player",
      allowedLevelDelta: 1
    }
  },
  {
    id: "capture_flamillon",
    creatureKey: "flamillon",
    challenge: {
      targetLevel: 1,
      scalingMode: "match_player",
      allowedLevelDelta: 1
    }
  },
  {
    id: "capture_plumevif",
    creatureKey: "plumevif",
    challenge: {
      targetLevel: 1,
      scalingMode: "match_player",
      allowedLevelDelta: 1
    }
  },
  {
    id: "capture_zephyr",
    creatureKey: "zephyr",
    challenge: {
      targetLevel: 1,
      scalingMode: "match_player",
      allowedLevelDelta: 1
    }
  },
  {
    id: "capture_loopio",
    creatureKey: "loopio",
    challenge: {
      targetLevel: 1,
      scalingMode: "match_player",
      allowedLevelDelta: 1
    }
  },
  {
    id: "capture_sillage",
    creatureKey: "sillage",
    challenge: {
      targetLevel: 1,
      scalingMode: "match_player",
      allowedLevelDelta: 1
    }
  },
  {
    id: "capture_nacrelame",
    creatureKey: "nacrelame",
    challenge: {
      targetLevel: 1,
      scalingMode: "match_player",
      allowedLevelDelta: 1
    }
  },
  {
    id: "capture_onde_lente",
    creatureKey: "ondeLente",
    challenge: {
      targetLevel: 1,
      scalingMode: "match_player",
      allowedLevelDelta: 1
    }
  }
];

function weightedPick(entries, random) {
  const totalWeight = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight ?? 1), 0);
  if (totalWeight <= 0) return entries[0] ?? null;
  let roll = random() * totalWeight;
  return entries.find((entry) => {
    roll -= Math.max(0, entry.weight ?? 1);
    return roll <= 0;
  }) ?? entries[entries.length - 1] ?? null;
}

function randomLevel(minLevel = 1, maxLevel = minLevel, random = Math.random) {
  const min = Math.max(1, Math.floor(Number(minLevel) || 1));
  const max = Math.max(min, Math.floor(Number(maxLevel) || min));
  return min + Math.floor(random() * (max - min + 1));
}

function creatureWithEncounterLevel(creature, level, perceptionBonus = 0) {
  const typePerception = creature.combat?.typeProfile?.stats?.perception ?? 0;
  const combatStats = creature.combat?.stats ?? {};
  const perception = (combatStats.perception ?? typePerception) + perceptionBonus;

  return {
    ...creature,
    combat: {
      ...creature.combat,
      stats: {
        ...combatStats,
        level,
        perception
      }
    }
  };
}

const warnedUnknownPools = new Set();

function warnUnknownPool(mapEncounterZone) {
  if (!import.meta.env?.DEV) return;
  const poolId = mapEncounterZone.poolId;
  if (warnedUnknownPools.has(poolId)) return;
  warnedUnknownPools.add(poolId);
  console.warn(
    `[map] Zone "${mapEncounterZone.id ?? "?"}" : poolId inconnu "${poolId}". `
    + `Pools disponibles : ${Object.keys(mapEncounterPools).join(", ")}. `
    + "Repli sur le pool global aléatoire (tous types)."
  );
}

function encounterFromMapZone(mapEncounterZone, random) {
  if (!mapEncounterZone?.poolId) return null;
  const pool = mapEncounterPools[mapEncounterZone.poolId];
  if (!pool?.length) {
    warnUnknownPool(mapEncounterZone);
    return null;
  }
  const entry = weightedPick(pool, random);
  if (!entry) return null;
  const level = randomLevel(mapEncounterZone.minLevel, mapEncounterZone.maxLevel, random);
  return {
    id: `capture_${mapEncounterZone.poolId}_${entry.creatureKey}`,
    creatureKey: entry.creatureKey,
    mapZoneId: mapEncounterZone.id ?? null,
    poolId: mapEncounterZone.poolId,
    challenge: {
      targetLevel: level,
      scalingMode: "match_player",
      allowedLevelDelta: 1
    },
    encounterLevel: level
  };
}

export function selectRandomCaptureEncounter({
  random = Math.random,
  encounterScaling = 0,
  mapEncounterZone = null,
  levelRange = null,
  perceptionBonus = 0
} = {}) {
  const encounter = encounterFromMapZone(mapEncounterZone, random)
    ?? captureEncounterPool[Math.floor(random() * captureEncounterPool.length)];
  const level = encounter.encounterLevel
    ?? (levelRange ? randomLevel(levelRange.minLevel, levelRange.maxLevel, random) : null)
    ?? encounter.challenge?.targetLevel
    ?? 1;
  const creature = creatureWithEncounterLevel(creatures[encounter.creatureKey], level, perceptionBonus);

  return {
    ...encounter,
    scaling: encounterScaling,
    affix: selectRandomAffixForType(creature.type, { random }),
    creature
  };
}
