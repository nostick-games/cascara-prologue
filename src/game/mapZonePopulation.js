export const prologueZoneCapacity = 2;

function zoneKey(zone) {
  return zone?.id ?? zone?.poolId ?? null;
}

function ensurePopulationEntry(progression, zone, capacity = prologueZoneCapacity) {
  const key = zoneKey(zone);
  if (!key) return null;
  progression.mapZonePopulations ??= {};
  progression.mapZonePopulations[key] ??= { captured: 0, capacity };
  const entry = progression.mapZonePopulations[key];
  entry.capacity ??= capacity;
  entry.captured ??= 0;
  return entry;
}

export function mapZonePopulation(progression, zone, capacity = prologueZoneCapacity) {
  const entry = ensurePopulationEntry(progression, zone, capacity);
  if (!entry) {
    return { key: null, captured: 0, capacity, remaining: capacity, available: true };
  }
  const captured = Math.max(0, Number(entry.captured) || 0);
  const resolvedCapacity = Math.max(0, Number(entry.capacity) || capacity);
  const remaining = Math.max(0, resolvedCapacity - captured);
  return {
    key: zoneKey(zone),
    captured,
    capacity: resolvedCapacity,
    remaining,
    available: remaining > 0
  };
}

export function isMapZoneAvailable(progression, zone, capacity = prologueZoneCapacity) {
  return mapZonePopulation(progression, zone, capacity).available;
}

export function consumeMapZoneCapture(progression, zone, capacity = prologueZoneCapacity) {
  const entry = ensurePopulationEntry(progression, zone, capacity);
  if (!entry) return null;
  const population = mapZonePopulation(progression, zone, capacity);
  if (!population.available) return population;
  entry.captured = population.captured + 1;
  return mapZonePopulation(progression, zone, capacity);
}
