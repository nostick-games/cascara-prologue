export const humanBuildTypeProfiles = {
  feu: {
    id: "feu",
    minCreatures: 2,
    statBonusPerRank: {
      power: 2,
      defense: -1
    },
    actionNames: {
      entaille: {
        nameKey: "human_action.feu.entaille.name",
        patternKey: "combat.pattern.human_fire_slash"
      },
      garde: {
        nameKey: "human_action.feu.garde.name",
        patternKey: "combat.pattern.human_fire_guard"
      },
      feinte: {
        nameKey: "human_action.feu.feinte.name",
        patternKey: "combat.pattern.human_fire_feint"
      },
      art: {
        nameKey: "human_action.feu.art.name",
        patternKey: "combat.pattern.human_fire_art"
      }
    },
    actionBonusesPerRank: {
      entaille: { baseDamage: 1 },
      feinte: { baseDamage: 1 },
      art: { baseDamage: 1 }
    },
    // Bonus de palier (à plat, dès le rang atteint) : l'Art feu gagne un cran
    // supplémentaire au rang 3 → +1/+2/+4 dégâts.
    rankGatedActionBonuses: {
      3: { art: { baseDamage: 1 } }
    }
  },
  eau: {
    id: "eau",
    minCreatures: 2,
    statBonusPerRank: {
      defense: 2,
      speed: -1
    },
    actionNames: {
      entaille: {
        nameKey: "human_action.eau.entaille.name",
        patternKey: "combat.pattern.human_water_slash"
      },
      garde: {
        nameKey: "human_action.eau.garde.name",
        patternKey: "combat.pattern.human_water_guard"
      },
      feinte: {
        nameKey: "human_action.eau.feinte.name",
        patternKey: "combat.pattern.human_water_feint"
      },
      art: {
        nameKey: "human_action.eau.art.name",
        patternKey: "combat.pattern.human_water_art"
      }
    },
    actionBonusesPerRank: {
      garde: { guard: 2, baseGuard: 2 }
    },
    // Contrôle eau : l'Art donne de la Garde au lanceur (2/3/3 selon le rang) et ne
    // renforce le déni de PA (-2) qu'au rang 3 — build eau dédié, pour éviter le swing.
    rankGatedActionBonuses: {
      1: { art: { selfGuard: 2 } },
      2: { art: { selfGuard: 1 } },
      3: { art: { enemyPaDamage: 1 } }
    }
  },
  vent: {
    id: "vent",
    minCreatures: 2,
    statBonusPerRank: {
      speed: 1,
      crit: 5,
      power: -1
    },
    actionNames: {
      entaille: {
        nameKey: "human_action.vent.entaille.name",
        patternKey: "combat.pattern.human_wind_slash"
      },
      garde: {
        nameKey: "human_action.vent.garde.name",
        patternKey: "combat.pattern.human_wind_guard"
      },
      feinte: {
        nameKey: "human_action.vent.feinte.name",
        patternKey: "combat.pattern.human_wind_feint"
      },
      art: {
        nameKey: "human_action.vent.art.name",
        patternKey: "combat.pattern.human_wind_art"
      }
    },
    // Tempo vent : l'Art garde le déni de -1 PA de base (commun à tous les Arts) et y
    // ajoute un remboursement de PA au lanceur (1/1/2). Identité = « Art de base, mais
    // efficient ». L'eau, elle, se distingue par le déni renforcé (-2). Feinte +crit.
    actionBonusesPerRank: {
      feinte: { critChance: 0.03 }
    },
    rankGatedActionBonuses: {
      1: { art: { paRefund: 1 } },
      3: { art: { paRefund: 1 } }
    }
  }
};

const maxBuildRank = 3;

function scaleNumericValues(values = {}, multiplier = 1) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value * multiplier])
  );
}

export function humanBuildTypeProfile(type, rank = 1) {
  const profile = humanBuildTypeProfiles[type];
  if (!profile) return null;
  const normalizedRank = Math.max(1, Math.min(maxBuildRank, Math.round(rank)));

  const actionBonuses = Object.fromEntries(
    Object.entries(profile.actionBonusesPerRank ?? {}).map(([actionId, bonus]) => [
      actionId,
      scaleNumericValues(bonus, normalizedRank)
    ])
  );

  // Bonus de palier : ajoutés à plat (non multipliés par le rang) dès que le rang
  // atteint le seuil. Ex. l'eau ne débloque le -2 PA de l'Art qu'au rang 3.
  Object.entries(profile.rankGatedActionBonuses ?? {}).forEach(([threshold, bonusByAction]) => {
    if (normalizedRank < Number(threshold)) return;
    Object.entries(bonusByAction).forEach(([actionId, bonus]) => {
      const current = { ...(actionBonuses[actionId] ?? {}) };
      Object.entries(bonus).forEach(([key, value]) => {
        current[key] = (current[key] ?? 0) + value;
      });
      actionBonuses[actionId] = current;
    });
  });

  return {
    ...profile,
    rank: normalizedRank,
    statBonus: scaleNumericValues(profile.statBonusPerRank, normalizedRank),
    actionBonuses
  };
}

export function dominantHumanBuildType(sources = []) {
  const sourcesByType = {};
  sources.forEach((source) => {
    if (!source.type) return;
    sourcesByType[source.type] ??= [];
    sourcesByType[source.type].push(source);
  });

  const profile = Object.values(humanBuildTypeProfiles).find((candidate) => (
    (sourcesByType[candidate.id]?.length ?? 0) >= candidate.minCreatures
  ));
  if (!profile) return null;

  const matchingSources = sourcesByType[profile.id];
  const averageLevel = matchingSources.reduce(
    (sum, source) => sum + Math.max(1, Math.min(maxBuildRank, source.level ?? 1)),
    0
  ) / matchingSources.length;

  return humanBuildTypeProfile(profile.id, averageLevel);
}

export function applyHumanBuildTypeToAction(action, buildTypeProfile) {
  if (!buildTypeProfile) return action;
  const namedAction = buildTypeProfile.actionNames?.[action.id] ?? {};
  const actionBonus = buildTypeProfile.actionBonuses?.[action.id] ?? {};

  const result = {
    ...action,
    ...namedAction,
    baseDamage: (action.baseDamage ?? 0) + (actionBonus.baseDamage ?? 0),
    guard: (action.guard ?? 0) + (actionBonus.guard ?? 0),
    baseGuard: (action.baseGuard ?? 0) + (actionBonus.baseGuard ?? 0),
    type: buildTypeProfile.id
  };
  // On ne touche enemyPaDamage/critChance que s'il y a un bonus, pour ne pas
  // écraser la valeur de base (ni forcer un 0 qui casserait le crit ennemi).
  if (actionBonus.enemyPaDamage) {
    result.enemyPaDamage = (action.enemyPaDamage ?? 0) + actionBonus.enemyPaDamage;
  }
  if (actionBonus.critChance) {
    result.critChance = (action.critChance ?? 0) + actionBonus.critChance;
  }
  if (actionBonus.selfGuard) {
    result.selfGuard = (action.selfGuard ?? 0) + actionBonus.selfGuard;
  }
  if (actionBonus.paRefund) {
    result.paRefund = (action.paRefund ?? 0) + actionBonus.paRefund;
  }
  return result;
}

export function applyHumanBuildTypeNamesToAction(action, buildTypeProfile) {
  if (!buildTypeProfile) return action;
  const namedAction = buildTypeProfile.actionNames?.[action.id] ?? {};

  return {
    ...action,
    ...namedAction,
    type: buildTypeProfile.id
  };
}
