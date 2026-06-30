const maxCreatureLevel = 3;
const maxInstinctLevel = 2;
const winsRequiredByLevel = {
  1: 3,
  2: 7
};

function clampCreatureLevel(level = 1) {
  return Math.max(1, Math.min(maxCreatureLevel, Math.trunc(level) || 1));
}

export function winsRequiredForNextCreatureLevel(level = 1) {
  return winsRequiredByLevel[clampCreatureLevel(level)] ?? null;
}

export function creatureLevelProgress(entry = {}) {
  const level = clampCreatureLevel(entry.level ?? 1);
  const required = winsRequiredForNextCreatureLevel(level);
  return {
    level,
    wins: Math.max(0, entry.levelWins ?? 0),
    required,
    maxed: required === null
  };
}

export function creatureInstinctLevel(entry = {}) {
  const creatureLevelBonus = clampCreatureLevel(entry.level ?? 1) - 1;
  const capturedInstinctLevel = Math.max(0, Math.trunc(entry.affixLevel ?? 0) || 0);
  return Math.min(maxInstinctLevel, capturedInstinctLevel + creatureLevelBonus);
}

export function recordEquippedCreatureVictory({ progression, equippedCreatures = [] }) {
  const capturedCreatures = progression?.capturedCreatures;
  if (!Array.isArray(capturedCreatures) || !equippedCreatures.length) return [];

  const equippedEntryIds = new Set(
    equippedCreatures
      .map((entry) => entry.entryId ?? entry.id)
      .filter(Boolean)
  );
  if (!equippedEntryIds.size) return [];

  const levelUps = [];
  capturedCreatures.forEach((entry) => {
    if (!equippedEntryIds.has(entry.id)) return;

    entry.level = clampCreatureLevel(entry.level ?? 1);
    entry.teamWins = Math.max(0, entry.teamWins ?? 0) + 1;
    entry.levelWins = Math.max(0, entry.levelWins ?? 0) + 1;

    const required = winsRequiredForNextCreatureLevel(entry.level);
    if (required === null || entry.levelWins < required) return;

    const previousLevel = entry.level;
    entry.level = clampCreatureLevel(entry.level + 1);
    entry.levelWins = 0;
    levelUps.push({
      entryId: entry.id,
      creatureId: entry.creatureId,
      affixId: entry.affixId ?? null,
      affixLevel: entry.affixLevel ?? 0,
      previousLevel,
      level: entry.level
    });
  });

  return levelUps;
}
