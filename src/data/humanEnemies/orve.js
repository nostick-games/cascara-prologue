export const orve = {
  id: "orve",
  type: "adepte",
  gender: "masculin",
  nameKey: "human_enemy.orve.name",
  stageLabelKey: "human_enemy.orve.stage_label",
  spriteLabelKey: "human_enemy.orve.sprite_label",
  sprites: {
    briefing: "assets/enemys/orve/orve.png",
    combat: "assets/enemys/orve/orve.png",
    frameCount: 10,
    frameWidth: 32,
    frameHeight: 32,
    combatScale: {
      desktop: 4,
      mobile: 4.5,
      mobileTall: 4.5
    }
  },
  mapDialog: {
    challengeKey: "map.orve.challenge",
    fightQuestionKey: "map.orve.fight_question",
    yesLabelKey: "map.orve.option.fight",
    noLabelKey: "map.orve.option.leave",
    defeatedKey: "map.orve.defeated",
    defeatBehavior: "dialogThenFade"
  },
  stats: {
    maxPa: 3
  },
  arsenal: {
    baseActionIds: ["entaille", "garde", "feinte", "art"],
    pattern: ["entaille", "garde", "art", "feinte"],
    followUpActionIds: ["entaille", "garde"],
    singleLightActionChance: 0.42
  },
  equippedCreatures: [
    { creatureId: "braise_corne", level: 2 },
    { creatureId: "onde_lente", level: 2 }
  ],
  activeAffixId: "morsure_sure",
  rewards: {
    victory: {
      stars: 22,
      gold: 18
    }
  }
};
