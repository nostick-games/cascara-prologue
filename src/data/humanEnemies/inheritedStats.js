import { creatures } from "../creatures.js";

const inheritableStatIds = ["power", "defense", "vitality", "crit", "speed"];

function createEmptyStats() {
  return Object.fromEntries(inheritableStatIds.map((statId) => [statId, 0]));
}

function addStats(target, source = {}) {
  inheritableStatIds.forEach((statId) => {
    target[statId] += source[statId] ?? 0;
  });
}

function resolveCreature(creatureId) {
  return creatures[creatureId]
    ?? Object.values(creatures).find((creature) => creature.id === creatureId)
    ?? null;
}

export function inheritedStatsForCreature(creature, level = 1) {
  const stats = createEmptyStats();
  addStats(stats, creature.combat?.typeProfile?.inheritedStats);
  addStats(stats, creature.inheritedStats?.speciesBonus);

  Object.entries(creature.inheritedStats?.levelBonuses ?? {}).forEach(([levelKey, bonus]) => {
    if (Number(levelKey) <= level) {
      addStats(stats, bonus);
    }
  });

  return stats;
}

export function computeEquippedCreatureStats(equippedCreatures = []) {
  const total = createEmptyStats();
  const sources = equippedCreatures.map((equippedCreature) => {
    const creature = resolveCreature(equippedCreature.creatureId);
    if (!creature) {
      return {
        creatureId: equippedCreature.creatureId,
        level: equippedCreature.level ?? 1,
        stats: createEmptyStats(),
        missing: true
      };
    }

    const level = equippedCreature.level ?? 1;
    const stats = inheritedStatsForCreature(creature, level);
    addStats(total, stats);

    return {
      creatureId: creature.id,
      level,
      type: creature.type,
      stats
    };
  });

  return { total, sources };
}
