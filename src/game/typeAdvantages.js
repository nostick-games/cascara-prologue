const typeAdvantage = {
  eau: "feu",
  feu: "vent",
  vent: "eau"
};

export const typeAdvantageDamageMultiplier = 1.4;
export const typeDisadvantageDamageMultiplier = 0.8;

export function hasTypeAdvantage(attackerType, defenderType) {
  if (!attackerType || !defenderType) return false;
  return typeAdvantage[attackerType] === defenderType;
}

export function hasTypeDisadvantage(attackerType, defenderType) {
  if (!attackerType || !defenderType) return false;
  // Désavantagé = le défenseur a l'avantage sur l'attaquant (matchup inverse).
  return typeAdvantage[defenderType] === attackerType;
}

export function applyTypeAdvantageDamage(damage, attackerType, defenderType) {
  if (hasTypeAdvantage(attackerType, defenderType)) {
    return {
      damage: Math.max(damage + 1, Math.round(damage * typeAdvantageDamageMultiplier)),
      advantaged: true,
      disadvantaged: false
    };
  }

  if (hasTypeDisadvantage(attackerType, defenderType)) {
    return {
      damage: Math.max(1, Math.round(damage * typeDisadvantageDamageMultiplier)),
      advantaged: false,
      disadvantaged: true
    };
  }

  return {
    damage,
    advantaged: false,
    disadvantaged: false
  };
}
