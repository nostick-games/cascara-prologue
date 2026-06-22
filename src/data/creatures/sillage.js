export const sillage = {
  id: "sillage",
  type: "utilitaire",
  nameKey: "creature.sillage.name",
  stageLabelKey: "creature.sillage.stage_label",
  spriteLabelKey: "creature.sillage.sprite_label",
  behaviorKey: "creature.sillage.behavior",
  sprites: {
    briefing: "assets/creatures/sillage.png",
    combat: "assets/creatures/sillage.png"
  },
  inheritedStats: {
    speciesBonus: {
      vitality: 2,
      defense: 1
    },
    levelBonuses: {
      2: { vitality: 1, perception: 1 },
      3: { defense: 1 }
    }
  },
  combat: {
    stats: {
      maxHp: 16,
      power: 3,
      defense: 3,
      speed: 4,
      perception: 4,
      critChance: 0.06,
      stability: 7
    },
    ai: {
      followUpActionIds: ["impGuard", "mischiefTap"],
      singleLightActionChance: 0.4
    },
    actions: {
      mischiefTap: {
        id: "mischiefTap",
        nameKey: "creature.sillage.action.mischief_tap",
        patternKey: "combat.pattern.mischief_tap",
        cost: 1,
        baseDamage: 1,
        powerScale: 0.4,
        scalingScale: 0.014,
        feintable: true,
        marked: false,
        kind: "simple"
      },
      impGuard: {
        id: "impGuard",
        nameKey: "creature.sillage.action.imp_guard",
        patternKey: "combat.pattern.imp_guard",
        cost: 1,
        guard: 2,
        scalingGuard: 0.42,
        feintable: false,
        marked: false,
        kind: "protection"
      },
      crystalTrick: {
        id: "crystalTrick",
        nameKey: "creature.sillage.action.crystal_trick",
        patternKey: "combat.pattern.crystal_trick",
        cost: 2,
        baseDamage: 2,
        powerScale: 0.62,
        scalingScale: 0.02,
        critChance: 0.12,
        feintable: true,
        marked: true,
        kind: "strong"
      },
      hornedHex: {
        id: "hornedHex",
        nameKey: "creature.sillage.action.horned_hex",
        patternKey: "combat.pattern.horned_hex",
        cost: 3,
        baseDamage: 3,
        powerScale: 0.78,
        scalingScale: 0.03,
        critChance: 0.1,
        feintable: true,
        marked: true,
        charging: true,
        kind: "art"
      }
    },
    pattern: ["mischiefTap", "impGuard", "crystalTrick", "mischiefTap", "hornedHex"]
  }
};
