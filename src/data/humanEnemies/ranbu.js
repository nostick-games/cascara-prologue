import { humanBuildTypeProfile } from "./humanBuildTypes.js";

export const ranbu = {
  id: "ranbu",
  type: "voleur",
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
    fightQuestionKey: "map.ranbu.fight_question"
  },
  stats: {
    maxHp: 8,
    maxPa: 3,
    power: -1
  },
  arsenal: {
    baseActionIds: ["entaille", "garde", "feinte", "art"],
    pattern: ["entaille", "feinte", "garde", "art"],
    followUpActionIds: ["entaille", "feinte"],
    singleLightActionChance: 0.52
  },
  equippedCreatures: [
    { creatureId: "zephyr", level: 1 }
  ],
  forcedBuildTypeProfile: humanBuildTypeProfile("vent", 1),
  activeAffixId: "pas_de_rafale",
  rewards: {
    victory: {
      stars: 8,
      gold: 5
    }
  }
};
