export const nacrelame = {
  id: "nacrelame",
  number: 3,
  type: "eau",
  nameKey: "creature.nacrelame.name",
  stageLabelKey: "creature.nacrelame.stage_label",
  spriteLabelKey: "creature.nacrelame.sprite_label",
  behaviorKey: "creature.nacrelame.behavior",
  sprites: {
    briefing: "assets/creatures/nacrelame.png",
    combat: "assets/creatures/nacrelame.png"
  },
  inheritedStats: {
    speciesBonus: {
      vitality: 2,
      defense: 1
    },
    levelBonuses: {
      2: { vitality: 1, defense: 1 },
      3: { perception: 1 }
    }
  },
  combat: {
    stats: {
      maxHp: 20,
      power: 2,
      defense: 3,
      speed: 3,
      perception: 3,
      stability: 7
    },
    ai: {
      followUpActionIds: ["ressacGuard", "pearlCut"],
      singleLightActionChance: 0.34
    },
    actions: {
      pearlCut: {
        id: "pearlCut",
        nameKey: "creature.nacrelame.action.pearl_cut",
        patternKey: "combat.pattern.pearl_cut",
        cost: 1,
        baseDamage: 1,
        powerScale: 0.45,
        scalingScale: 0.015,
        feintable: true,
        marked: false,
        kind: "simple"
      },
      ressacGuard: {
        id: "ressacGuard",
        nameKey: "creature.nacrelame.action.ressac_guard",
        patternKey: "combat.pattern.ressac_guard",
        cost: 1,
        guard: 2,
        scalingGuard: 0.45,
        feintable: false,
        marked: false,
        kind: "protection"
      },
      tideSlash: {
        id: "tideSlash",
        nameKey: "creature.nacrelame.action.tide_slash",
        patternKey: "combat.pattern.tide_slash",
        cost: 2,
        baseDamage: 2,
        powerScale: 0.72,
        scalingScale: 0.025,
        feintable: true,
        marked: true,
        kind: "strong"
      },
      undertowBlade: {
        id: "undertowBlade",
        nameKey: "creature.nacrelame.action.undertow_blade",
        patternKey: "combat.pattern.undertow_blade",
        cost: 3,
        baseDamage: 3,
        powerScale: 0.9,
        scalingScale: 0.035,
        feintable: true,
        marked: true,
        charging: true,
        kind: "art"
      }
    },
    pattern: ["pearlCut", "ressacGuard", "tideSlash", "undertowBlade", "ressacGuard"]
  }
};
