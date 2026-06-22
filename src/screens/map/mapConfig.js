import { assetPath } from "../../utils/assetPath.js";

export const defaultMapId = "prologue";
export const mapBasePath = assetPath("assets/maps/");

export const heroAnimations = {
  idleDown: { src: assetPath("assets/hero/hero_idle_down.png"), frames: 12 },
  idleLeft: { src: assetPath("assets/hero/hero_idle_left.png"), frames: 12 },
  idleRight: { src: assetPath("assets/hero/hero_idle_right.png"), frames: 12 },
  idleUp: { src: assetPath("assets/hero/hero_idle_up.png"), frames: 4 },
  walkDown: { src: assetPath("assets/hero/hero_walk_down.png"), frames: 6 },
  walkLeft: { src: assetPath("assets/hero/hero_walk_left.png"), frames: 6 },
  walkRight: { src: assetPath("assets/hero/hero_walk_right.png"), frames: 6 },
  walkUp: { src: assetPath("assets/hero/hero_walk_up.png"), frames: 6 },
  respawn: { src: assetPath("assets/hero/hero_respawn.png"), frames: 4 }
};

export const heroRespawnFrameTimeline = [
  { frame: 0, duration: 34 },
  { frame: 1, duration: 38 },
  { frame: 2, duration: 42 },
  { frame: 3, duration: 48 },
  { frame: 0, duration: 56 },
  { frame: 1, duration: 68 },
  { frame: 2, duration: 84 },
  { frame: 3, duration: 104 },
  { frame: 0, duration: 130 },
  { frame: 1, duration: 164 },
  { frame: 2, duration: 208 },
  { frame: 3, duration: 264 },
  { frame: 0, duration: 280 }
];

export const directionByKey = {
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  KeyQ: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  KeyZ: "up"
};

export const tileFlipFlags = 0xe0000000;
export const encounterLayerName = "Créatures";
export const encounterZonesLayerName = "zones_creatures";
export const collisionLayerName = "collisions";
export const decorUpLayerName = "decor up";
export const decorYSortLayerName = "decor ysort";
export const decorYSortDefaultOffset = -6;
export const cloudLayerName = "nuages";
export const npcLayerName = "pnj";
export const teleportLayerName = "teleport";
export const doorsLayerName = "doors";
export const itemsLayerName = "items";
export const pixelAnimationsLayerName = "animations pixel";
export const defaultRespawnType = "respawn_default";
export const discoveredRespawnTypes = new Set(["respawn_found", "respawn_discovered"]);
export const aragorObjectName = "aragor";
export const caveClosedLayerName = "grotte";
export const caveOpenLayerName = "grotte_on";
export const encounterChance = 0.18;
export const humanEncounterTriggerBox = {
  halfWidth: 26,
  topOffset: 24,
  bottomOffset: 38
};
export const humanEncounterNudgeSpeed = 84;
export const joystickMaxDistance = 34;
export const joystickDeadZone = 0.18;
export const mapCameraZoom = 1.5;
export const heroSpawnTile = { x: 8.5, y: 37.2 };
export const minimapDiscoveryRadiusTiles = 5;
export const humanEncounterConfigs = [
  {
    id: aragorObjectName,
    objectName: aragorObjectName,
    sprite: {
      src: assetPath("assets/enemys/aragor/aragor_idle.png"),
      frames: 5,
      frameSize: 32,
      drawSize: 32
    }
  },
  {
    id: "ilda",
    objectName: "ilda",
    sprite: {
      src: assetPath("assets/enemys/ilda/ilda.png"),
      frames: 7,
      frameSize: 32,
      drawSize: 32
    }
  },
  {
    id: "ranbu",
    objectName: "ranbu",
    sprite: {
      src: assetPath("assets/enemys/ranbu/ranbu.png"),
      frames: 12,
      frameSize: 32,
      drawSize: 32
    }
  }
];
export const humanEncounterConfigById = Object.fromEntries(
  humanEncounterConfigs.map((config) => [config.id, config])
);
export const humanEncounterFallbackConfig = humanEncounterConfigs[0];
export const humanEncounterFallbackId = humanEncounterFallbackConfig.id;
export const humanEncounterImageEntries = humanEncounterConfigs.map((config) => [config.id, config.sprite.src]);
export const humanEncounterImageSources = [...new Set(humanEncounterImageEntries.map(([, src]) => src))];
export const humanEncounterSpriteById = Object.fromEntries(
  humanEncounterConfigs.map((config) => [config.id, config.sprite])
);
export const heroCollisionBox = {
  halfWidth: 5,
  topOffset: 7,
  bottomOffset: 2
};
export const mapDialogTypeDelayMs = 12;
export const mapDialogLinePauseMs = 360;
export const chestSprite = {
  src: assetPath("assets/objects/coffre1.png"),
  frameSize: 32,
  frames: 4,
  drawSize: 32,
  frameDurationMs: 360
};
export const respawnSprite = {
  src: assetPath("assets/objects/teleport.png"),
  frameSize: 48,
  frames: 6,
  drawSize: 48,
  frameDurationMs: 120
};
export const chestTriggerRadius = 26;
export const doorTriggerCooldownMs = 450;
export const doorTriggerPaddingX = 8;
export const doorTriggerPaddingY = 8;
export const npcTriggerRadius = 28;
export const respawnDiscoveryBounds = {
  width: 32,
  height: 40,
  offsetY: 4
};
export const heroName = "Houdini";
export const chadTrainingActionIds = [
  "slash",
  "guard",
  "feint",
  "art",
  "capture",
  "bag",
  "end_turn",
  "aptitudes",
  "stars_gems",
  "fawnas"
];
export const mapNpcDialogs = {
  nora_home_intro: {
    speakerKey: "map.npc.nora.name",
    introKeys: [
      "map.npc.nora.home_intro.1",
      "map.npc.nora.home_intro.2",
      "map.npc.nora.home_intro.3",
      "map.npc.nora.home_intro.4",
      "map.npc.nora.home_intro.5"
    ],
    repeatKeys: [
      "map.npc.nora.home_repeat.1"
    ]
  },
  chad_training: {
    speakerKey: "map.npc.chad.name",
    requiredCompletedDialogId: "nora_home_intro",
    lockedKeys: [
      "map.npc.chad.before_nora.1"
    ],
    menu: {
      introKey: "map.npc.chad.intro",
      repeatKey: "map.npc.chad.menu_again",
      optionLayout: "vertical",
      exitValue: "enough",
      showExitOptionInitially: true,
      highlights: ["Chad", "Veyr"],
      options: [
        {
          labelKey: "map.npc.chad.option.fight",
          value: "fight",
          action: "humanEncounter",
          enemyId: "chad",
          messageKey: "map.npc.chad.training_intro",
          continueDelayMs: 650
        },
        {
          labelKey: "map.npc.chad.option.learn",
          value: "learn",
          action: "choicePanel",
          panelPromptKey: "map.npc.chad.ask_topic",
          panelChoices: chadTrainingActionIds,
          panelLabelKeyPrefix: "map.npc.chad.topic.",
          responseKeyPrefix: "map.npc.chad.explain.",
          revealExitOption: true
        }
      ],
      exitOption: {
        labelKey: "map.npc.chad.option.enough",
        value: "enough"
      }
    },
    introKeys: [],
    repeatKeys: []
  }
};
export const mapNpcDefaults = {
  merchant_prologue: {
    type: "npc",
    sprite: "lobo",
    frames: 8,
    frameSize: 32,
    drawSize: 32,
    frameDuration: 130,
    shopId: "prologue_lobo"
  },
  arachnide: {
    type: "npc",
    sprite: "archnide",
    frames: 8,
    frameSize: 32,
    drawSize: 32,
    frameDuration: 130,
    serviceId: "arachnide_replenish"
  },
  archnide: {
    type: "npc",
    sprite: "archnide",
    frames: 8,
    frameSize: 32,
    drawSize: 32,
    frameDuration: 130,
    serviceId: "arachnide_replenish"
  }
};
