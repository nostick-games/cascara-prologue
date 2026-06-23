export const humanEnemyTypes = {
  gardien: {
    id: "gardien",
    nameKey: "human_enemy.type.gardien.name",
    stats: {
      maxHp: 70,
      power: 8,
      defense: 6,
      speed: 2,
      crit: 2,
      perception: 3
    }
  },
  villageoise: {
    id: "villageoise",
    nameKey: "human_enemy.type.villageoise.name",
    stats: {
      maxHp: 20,
      power: 5,
      defense: 2,
      speed: 7,
      crit: 12,
      perception: 4
    }
  },
  voleur: {
    id: "voleur",
    nameKey: "human_enemy.type.voleur.name",
    stats: {
      maxHp: 24,
      power: 4,
      defense: 4,
      speed: 8,
      crit: 16,
      perception: 5
    }
  },
  adepte: {
    id: "adepte",
    nameKey: "human_enemy.type.adepte.name",
    // Couleur « bruiser » (option A) : encaisse, lent, dégâts modérés. La Signature a
    // le temps de sortir et le combat devient tactique plutôt qu'une course au burst.
    stats: {
      maxHp: 45,
      power: 7,
      defense: 6,
      speed: 2,
      crit: 2,
      perception: 4
    }
  },
  entraineur: {
    id: "entraineur",
    nameKey: "human_enemy.type.entraineur.name",
    stats: {}
  }
};

export function humanEnemyTypeProfile(type) {
  return humanEnemyTypes[type] ?? null;
}
