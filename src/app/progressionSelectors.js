export function ownedCreatures({ progression, creatures }) {
  const creaturesById = Object.fromEntries(
    Object.values(creatures).map((creature) => [creature.id, creature])
  );
  const captured = progression.capturedCreatures ?? [];

  return captured
    .map((entry) => ({ entry, creature: creaturesById[entry.creatureId] }))
    .filter(({ creature }) => Boolean(creature))
    .sort((a, b) => (b.entry.capturedAt ?? 0) - (a.entry.capturedAt ?? 0));
}

export function spentBuildPoints({ build, initialBuild, allocatableStatIds }) {
  return allocatableStatIds
    .reduce((sum, statId) => sum + Math.max(0, build[statId] - initialBuild[statId]), 0);
}

export function unspentXp({ progression, build, initialBuild, allocatableStatIds }) {
  return Math.max(0, progression.availableXp - spentBuildPoints({
    build,
    initialBuild,
    allocatableStatIds
  }));
}
