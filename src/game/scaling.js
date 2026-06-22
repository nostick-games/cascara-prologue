export function calculateEncounterScalingFromXp(xp, { xpPerScaling = 5 } = {}) {
  return Math.max(0, Math.floor(xp / xpPerScaling));
}
