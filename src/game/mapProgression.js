export const defaultWorldMapId = "prologue";

export function isWorldMapId(mapId) {
  return Boolean(mapId) && !mapId.startsWith("maison_");
}

export function visitedWorldMapIds(progression = {}) {
  const visitedMapIds = progression.visitedMapIds?.length
    ? progression.visitedMapIds
    : [defaultWorldMapId];

  return visitedMapIds.filter(isWorldMapId);
}

export function recordVisitedWorldMap(progression = {}, mapId = defaultWorldMapId) {
  if (!isWorldMapId(mapId)) return false;

  progression.visitedMapIds ??= [defaultWorldMapId];
  if (progression.visitedMapIds.includes(mapId)) return false;

  progression.visitedMapIds.push(mapId);
  return true;
}

export function worldMapPerceptionBonus(progression = {}) {
  return Math.max(0, visitedWorldMapIds(progression).length - 1);
}
