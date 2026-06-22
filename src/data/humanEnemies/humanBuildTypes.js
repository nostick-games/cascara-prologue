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
    actionBonusesPerRank: {}
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

  return {
    ...profile,
    rank: normalizedRank,
    statBonus: scaleNumericValues(profile.statBonusPerRank, normalizedRank),
    actionBonuses: Object.fromEntries(
      Object.entries(profile.actionBonusesPerRank ?? {}).map(([actionId, bonus]) => [
        actionId,
        scaleNumericValues(bonus, normalizedRank)
      ])
    )
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

  return {
    ...action,
    ...namedAction,
    baseDamage: (action.baseDamage ?? 0) + (actionBonus.baseDamage ?? 0),
    guard: (action.guard ?? 0) + (actionBonus.guard ?? 0),
    baseGuard: (action.baseGuard ?? 0) + (actionBonus.baseGuard ?? 0),
    type: buildTypeProfile.id
  };
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
