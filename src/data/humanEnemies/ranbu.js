export const ranbu = {
  id: "ranbu",
  type: "villageoise",
  typeNameKey: "human_enemy.type.gredin.name",
  nameKey: "human_enemy.ranbu.name",
  stageLabelKey: "human_enemy.ranbu.stage_label",
  spriteLabelKey: "human_enemy.ranbu.sprite_label",
  sprites: {
    briefing: "assets/enemys/ranbu/ranbu.png",
    combat: "assets/enemys/ranbu/ranbu.png",
    frameCount: 12,
    frameWidth: 32,
    frameHeight: 32,
    combatScale: {
      desktop: 4,
      mobile: 4.5,
      mobileTall: 4.5
    }
  },
  mapDialog: {
    challengeKey: "map.ranbu.challenge",
    fightQuestionKey: "map.ranbu.fight_question",
    defeatBehavior: "dialogThenFade"
  },
  stats: {
    maxHp: 10,
    maxPa: 3
  },
  arsenal: {
    baseActionIds: ["entaille", "garde", "feinte", "art"],
    singleLightActionChance: 0.48
  },
  equippedCreatures: [
    { creatureId: "onde_lente", level: 1 }
  ],
  activeAffixId: "instinct_ecaille",
  rewards: {
    victory: {
      stars: 10,
      gold: 4
    }
  }
};
