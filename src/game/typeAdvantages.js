const typeAdvantage = {
  eau: "feu",
  feu: "vent",
  vent: "eau"
};

export const typeAdvantageDamageMultiplier = 1.25;

export function hasTypeAdvantage(attackerType, defenderType) {
  if (!attackerType || !defenderType) return false;
  return typeAdvantage[attackerType] === defenderType;
}

export function applyTypeAdvantageDamage(damage, attackerType, defenderType) {
  if (!hasTypeAdvantage(attackerType, defenderType)) {
    return {
      damage,
      advantaged: false
    };
  }

  return {
    damage: Math.max(damage + 1, Math.round(damage * typeAdvantageDamageMultiplier)),
    advantaged: true
  };
}
