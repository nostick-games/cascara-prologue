const statusChanceByCreatureLevel = [0.4, 0.55, 0.7];

export const creatureTypes = {
  feu: {
    id: "feu",
    inheritedStats: {
      power: 1,
      crit: 1
    },
    stats: {
      level: 1,
      maxHp: 15,
      maxPa: 3,
      power: 4,
      defense: 1,
      speed: 4,
      perception: 1,
      critChance: 0.08,
      stability: 5,
      hpScaling: 2
    },
    status: {
      id: "brulure",
      chanceByLevel: statusChanceByCreatureLevel,
      intensityByLevel: [1, 2, 3]
    }
  },
  eau: {
    id: "eau",
    inheritedStats: {
      defense: 1,
      perception: 1
    },
    stats: {
      level: 1,
      maxHp: 18,
      maxPa: 3,
      power: 2,
      defense: 2,
      speed: 3,
      perception: 2,
      critChance: 0.04,
      stability: 6,
      hpScaling: 2
    },
    status: {
      id: "paralysie",
      chanceByLevel: statusChanceByCreatureLevel,
      intensityByLevel: [0.2, 0.25, 0.3]
    }
  },
  vent: {
    id: "vent",
    inheritedStats: {
      speed: 1,
      crit: 1
    },
    stats: {
      level: 1,
      maxHp: 14,
      maxPa: 3,
      power: 3,
      defense: 1,
      speed: 6,
      perception: 3,
      critChance: 0.06,
      stability: 4,
      hpScaling: 1
    },
    status: {
      id: "a_decouvert",
      chanceByLevel: statusChanceByCreatureLevel,
      intensityByLevel: [1, 2, 3]
    }
  },
  utilitaire: {
    id: "utilitaire",
    inheritedStats: {
      defense: 1,
      perception: 1
    },
    stats: {
      level: 1,
      maxHp: 16,
      maxPa: 3,
      power: 3,
      defense: 2,
      speed: 4,
      perception: 3,
      critChance: 0.05,
      stability: 5,
      hpScaling: 2
    },
    status: null
  }
};

export function creatureTypeProfile(type) {
  return creatureTypes[type] ?? null;
}
