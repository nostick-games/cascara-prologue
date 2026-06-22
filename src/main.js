import "./styles/index.css";
import { actionDefinitions } from "./data/actions.js";
import { creatures } from "./data/creatures.js";
import { baseHero } from "./data/hero/index.js";
import { playerRadarAllocatableStatIds, playerRadarStatDefinitions } from "./data/playerRadarStats.js";
import { baseProgression } from "./data/progression/index.js";
import { CombatController } from "./game/CombatController.js";
import { InventoryModal } from "./ui/InventoryModal.js";
import { HuntBriefingScreen } from "./screens/HuntBriefingScreen.js";
import { HumanBriefingScreen } from "./screens/HumanBriefingScreen.js";
import { CombatScreen } from "./screens/CombatScreen.js";
import { MapScreen } from "./screens/MapScreen.js";
import { locales, DEFAULT_LANGUAGE } from "./locales/index.js";
import { consumeMapZoneCapture, isMapZoneAvailable, mapZonePopulation } from "./game/mapZonePopulation.js";
import { createI18n } from "./utils/i18n.js";
import { createAdventureFlow } from "./app/adventureFlow.js";
import { mountAppShell } from "./app/appShell.js";
import { createCombatLauncher } from "./app/combatLauncher.js";
import { queryDomNodes } from "./app/domNodes.js";
import { createCaptureEncounterState, createHumanEncounterState } from "./app/encounterFactory.js";
import { recordVisitedWorldMap } from "./game/mapProgression.js";
import { createAdaptiveHumanEncounterEnemy } from "./data/humanEncounters.js";
import {
  ownedCreatures as selectOwnedCreatures,
  unspentXp as selectUnspentXp
} from "./app/progressionSelectors.js";
import { createScreenRouter, gameScreens } from "./app/screenRouter.js";
import { createStaticTextRenderer } from "./app/staticTextRenderer.js";
import { createViewportFit } from "./app/viewportFit.js";
import { playWhiteFlash } from "./app/encounterTransition.js";
import { bindPress } from "./ui/bindPress.js";
import { MapRadarModal } from "./ui/MapRadarModal.js";
import { MapPopulationModal } from "./ui/MapPopulationModal.js";
import { MapHealerFlow } from "./ui/MapHealerFlow.js";
import { MapShopFlow } from "./ui/MapShopFlow.js";
import { setPixelButtonLabel } from "./ui/PixelButton.js";

const mapQuickActionsFreezeMs = 650;

const appRoot = document.querySelector("#app");
mountAppShell(appRoot);

const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
const i18n = createI18n({
  locales,
  defaultLanguage: DEFAULT_LANGUAGE,
  initialLanguage: requestedLanguage || DEFAULT_LANGUAGE,
  onChange: () => {
    renderAll();
    if (combatController?.hasCombat()) {
      combatController.renderCombatUi();
      combatScreen.syncCombat(combatController.getCombat());
    }
  }
});
const { t, validateLocales } = i18n;
let captureEncounterState = createCaptureEncounterState({
  progression: baseProgression,
  defaultCompletedHunts: 3
});
let encounter = captureEncounterState.encounter;
let creature = captureEncounterState.creature;
let encounterAffix = captureEncounterState.encounterAffix;
let ownedHuntAffixes = captureEncounterState.ownedHuntAffixes;
let selectedEncounterIntroKey = captureEncounterState.encounterIntroKey;
let objectivesData = captureEncounterState.objectives;

let humanEncounterState = createHumanEncounterState({ progression: baseProgression });
let humanEncounter = humanEncounterState.encounter;
let humanEnemy = humanEncounterState.enemy;
let selectedHumanEncounterIntroKey = humanEncounterState.encounterIntroKey;
let queuedCaptureEncounterState = null;

const allocatableStatIds = playerRadarAllocatableStatIds();

function ownedCreatures() {
  return selectOwnedCreatures({
    progression: baseProgression,
    creatures
  });
}

function unspentXp() {
  return selectUnspentXp({
    progression: baseProgression,
    build,
    initialBuild,
    allocatableStatIds
  });
}

const build = { ...baseHero.stats };
const initialBuild = { ...build };
const committedBuild = { ...build };
const heroName = "Houdini";
const {
  affixButton,
  appNode,
  behaviorButton,
  briefingModal,
  briefingModalClose,
  briefingModalDescription,
  briefingModalObjectives,
  briefingModalShield,
  briefingModalTitle,
  captureConditionsButton,
  chooseCreatureHuntButton,
  chooseHumanCombatButton,
  chooseMapButton,
  combatNodes,
  combatSection,
  creatureSprite,
  creatureStage,
  encounterSentenceNode,
  encounterTransition,
  fleeButton,
  humanBriefingSection,
  humanEncounterSentenceNode,
  humanEnemyRadarButton,
  humanEnemyTeamSlots,
  humanEnemyRadarCanvas,
  humanEnemyRadarModal,
  humanEnemyRadarModalClose,
  humanEnemyRadarModalDescription,
  humanEnemyRadarModalShield,
  humanEnemyRadarModalTitle,
  humanInstinctButton,
  humanPointsLeftNode,
  humanPointsUnitNode,
  humanRadarCanvas,
  humanRadarModal,
  humanRadarModalClose,
  humanRadarModalDescription,
  humanRadarModalPoints,
  humanRadarModalShield,
  humanRadarModalTitle,
  humanRadarTitle,
  humanResetBuildButton,
  humanRosterSlots,
  humanSprite,
  humanStage,
  humanStatsNode,
  huntCreatureLevel,
  huntCreatureType,
  instinctModal,
  instinctModalClose,
  instinctModalList,
  instinctModalPrompt,
  instinctModalShield,
  instinctModalTitle,
  inventoryGemsText,
  inventoryGoldText,
  inventoryHeroHpBar,
  inventoryHeroHpLabel,
  inventoryHeroHpText,
  inventoryItemsNode,
  inventoryModalClose,
  inventoryModalOptions,
  inventoryModalShield,
  inventoryStarsText,
  logNode,
  mapCanvas,
  mapCreaturesButton,
  mapDialogFrame,
  mapDialogLog,
  mapInventoryButton,
  mapJoystick,
  mapJoystickBase,
  mapJoystickStick,
  mapPopulationButton,
  mapPopulationCanvas,
  mapPopulationLegend,
  mapPopulationModal: mapPopulationModalNode,
  mapPopulationModalClose,
  mapPopulationModalDescription,
  mapPopulationModalShield,
  mapPopulationModalTitle,
  mapRewardModal,
  mapRewardModalDescription,
  mapRewardModalOk,
  mapRewardModalShield,
  mapRewardModalTitle,
  mapRadarButton,
  mapRadarCanvas,
  mapRadarModal,
  mapRadarModalClose,
  mapRadarModalShield,
  mapRadarPointsLeft,
  mapRadarPointsUnit,
  mapRadarResetBuild,
  mapRadarStatModal,
  mapRadarStatModalClose,
  mapRadarStatModalDescription,
  mapRadarStatModalPoints,
  mapRadarStatModalShield,
  mapRadarStatModalTitle,
  mapRadarStats,
  mapSection,
  orientationPrompt,
  orientationTitle,
  pointsLeftNode,
  pointsUnitNode,
  prepSection,
  radarCanvas,
  radarModal,
  radarModalClose,
  radarModalDescription,
  radarModalPoints,
  radarModalShield,
  radarModalTitle,
  radarTitle,
  resetBuildButton,
  rewardsButton,
  startCaptureButton,
  startChoiceTitle,
  startHumanCombatButton,
  startSection,
  statsNode
} = queryDomNodes();

let mapScreen = null;

const screenRouter = createScreenRouter({
  body: document.body,
  screens: {
    [gameScreens.start]: startSection,
    [gameScreens.map]: mapSection,
    [gameScreens.huntBriefing]: prepSection,
    [gameScreens.humanBriefing]: humanBriefingSection,
    [gameScreens.combat]: combatSection
  },
  bodyClassByScreen: {
    [gameScreens.start]: "start-active",
    [gameScreens.map]: "map-active",
    [gameScreens.huntBriefing]: "briefing-active hunt-briefing-active",
    [gameScreens.humanBriefing]: "briefing-active human-briefing-active",
    [gameScreens.combat]: "combat-active"
  },
  onChange: (screenId) => {
    if (screenId !== gameScreens.map) mapScreen?.stop();
    setCombatFrozen(false);
    document.body.classList.remove("capture-conditions-modal-open");
    scheduleViewportFit();
  }
});

let adventureFlow = null;

function isCaptureConditionsModalOpen() {
  return document.body.classList.contains("capture-conditions-modal-open");
}

function setCombatFrozen(frozen) {
  if (!combatSection) return;
  combatSection.inert = Boolean(frozen);
}
let combatController = null;
let combatLauncher = null;
let staticTextRenderer = null;
const guardBarPointScale = 6;

const briefingScreen = new HuntBriefingScreen({
  nodes: {
    radarCanvas,
    statsNode,
    radarModal,
    radarModalTitle,
    radarModalDescription,
    radarModalPoints,
    radarModalClose,
    radarModalShield,
    pointsLeft: pointsLeftNode,
    pointsUnit: pointsUnitNode,
    startCaptureButton,
    resetBuildButton,
    affixButton,
    fleeButton,
    encounterSentence: encounterSentenceNode,
    behaviorButton,
    rewardsButton,
    captureConditionsButton,
    huntCreatureLevel,
    huntCreatureType,
    briefingModal,
    briefingModalShield,
    briefingModalTitle,
    briefingModalDescription,
    briefingModalObjectives,
    briefingModalClose,
    creatureStage,
    creatureSprite,
    radarTitle
  },
  t,
  creature,
  encounterIntroKey: selectedEncounterIntroKey,
  stats: playerRadarStatDefinitions,
  build,
  initialBuild,
  resetBuild: committedBuild,
  totalPoints: baseProgression.availableXp,
  objectives: objectivesData,
  encounterAffix,
  ownedHuntAffixes,
  selectedHuntAffixId: baseProgression.preparedHuntAffixId,
  isLocked: () => adventureFlow?.isGameStarted() ?? false,
  onChange: () => renderAll(),
  onStart: () => startCaptureSequence(),
  onReset: () => resetBuildSequence(),
  onFlee: () => adventureFlow?.fleeHuntBriefing(),
  onModalStateChange: ({ open, kind }) => {
    setCombatFrozen(open && kind === "conditions" && screenRouter.current === gameScreens.combat);
  }
});

const humanBriefingScreen = new HumanBriefingScreen({
  nodes: {
    radarCanvas: humanRadarCanvas,
    statsNode: humanStatsNode,
    radarModal: humanRadarModal,
    radarModalTitle: humanRadarModalTitle,
    radarModalDescription: humanRadarModalDescription,
    radarModalPoints: humanRadarModalPoints,
    radarModalClose: humanRadarModalClose,
    radarModalShield: humanRadarModalShield,
    pointsLeft: humanPointsLeftNode,
    pointsUnit: humanPointsUnitNode,
    resetBuildButton: humanResetBuildButton,
    startCombatButton: startHumanCombatButton,
    encounterSentence: humanEncounterSentenceNode,
    stage: humanStage,
    sprite: humanSprite,
    enemyTeamSlots: humanEnemyTeamSlots,
    enemyRadarButton: humanEnemyRadarButton,
    enemyRadarModalShield: humanEnemyRadarModalShield,
    enemyRadarModal: humanEnemyRadarModal,
    enemyRadarModalTitle: humanEnemyRadarModalTitle,
    enemyRadarModalDescription: humanEnemyRadarModalDescription,
    enemyRadarCanvas: humanEnemyRadarCanvas,
    enemyRadarModalClose: humanEnemyRadarModalClose,
    enemyTeamModalShield: humanEnemyTeamModalShield,
    enemyTeamModal: humanEnemyTeamModal,
    enemyTeamModalTitle: humanEnemyTeamModalTitle,
    enemyTeamModalList: humanEnemyTeamModalList,
    enemyTeamModalClose: humanEnemyTeamModalClose,
    radarTitle: humanRadarTitle,
    rosterSlots: humanRosterSlots,
    instinctButton: humanInstinctButton,
    instinctModalShield,
    instinctModal,
    instinctModalTitle,
    instinctModalPrompt,
    instinctModalList,
    instinctModalClose
  },
  t,
  enemy: humanEnemy,
  encounterIntroKey: selectedHumanEncounterIntroKey,
  stats: playerRadarStatDefinitions,
  build,
  initialBuild,
  resetBuild: committedBuild,
  totalPoints: baseProgression.availableXp,
  isLocked: () => adventureFlow?.isGameStarted() ?? false,
  onChange: () => renderAll(),
  onReset: () => resetBuildSequence(),
  onStart: () => startHumanCombatPrototype(),
  getOwnedCreatures: () => ownedCreatures(),
  enemyAdapter: ({ baseEnemy, playerBuild, playerBuildType, playerTeam }) => createAdaptiveHumanEncounterEnemy({
    enemy: baseEnemy,
    encounterScaling: humanEncounter?.scaling ?? 0,
    playerBaseBuild: build,
    playerBuild,
    playerBuildType,
    playerTeam
  })
});

const combatScreen = new CombatScreen({
  nodes: combatNodes,
  t,
  creature,
  actionDefinitions,
  objectives: objectivesData,
  build,
  guardBarPointScale,
  objectiveLabel: (objective) => objectiveLabel(objective),
  onAction: (actionId) => {
    if (isCaptureConditionsModalOpen()) return;
    combatController?.playerAction(actionId);
  },
  heroName,
  onObjectivesClick: () => {
    if (isCaptureConditionsModalOpen()) return;
    const combat = combatController?.getCombat();
    if (!combat) return;
    briefingScreen.openConditionsModal(combat.objectives);
  },
  canOpenObjectives: () => mobileFitQuery.matches && !isCaptureConditionsModalOpen()
});

const mapShopFlow = new MapShopFlow({
  t,
  getGold: () => baseProgression.gold ?? 0,
  setGold: (gold) => {
    baseProgression.gold = Math.max(0, gold);
  },
  addInventoryItem: (itemId, quantity) => {
    baseProgression.inventory ??= {};
    baseProgression.inventory[itemId] = (baseProgression.inventory[itemId] ?? 0) + quantity;
  },
  getInventoryQuantity: (itemId) => baseProgression.inventory?.[itemId] ?? 0,
  render: () => renderAll()
});

const mapHealerFlow = new MapHealerFlow({
  t,
  getGold: () => baseProgression.gold ?? 0,
  setGold: (gold) => {
    baseProgression.gold = Math.max(0, gold);
  },
  getCost: () => baseProgression.arachnideReplenishCost ?? 10,
  setCost: (cost) => {
    baseProgression.arachnideReplenishCost = Math.max(0, cost);
  },
  getHeroStatus: () => currentHeroStatus(),
  setHeroHp: (hp, maxHp) => {
    baseProgression.heroMaxHp = maxHp;
    baseProgression.heroHp = Math.max(0, Math.min(maxHp, hp));
  },
  getHeroName: () => heroName,
  render: () => renderAll()
});

mapScreen = new MapScreen({
  nodes: {
    mapSection,
    canvas: mapCanvas,
    mapDialogFrame,
    mapDialogLog,
    mapChoicePanel,
    mapChoiceList,
    joystick: mapJoystick,
    joystickBase: mapJoystickBase,
    joystickStick: mapJoystickStick
  },
  t,
  isMobile: () => mobileFitQuery.matches,
  isEncounterZoneAvailable: (zone) => isMapZoneAvailable(baseProgression, zone),
  isChestOpened: (flag) => baseProgression.openedMapFlags?.includes(flag),
  onChestReward: (chest) => collectMapChestReward(chest),
  onEncounter: (payload) => adventureFlow?.openHuntBriefingFromMap(payload?.zone),
  onHumanEncounter: (payload) => adventureFlow?.openHumanEncounterFromMap(payload),
  onShop: ({ shop, host, speaker }) => mapShopFlow.run(shop, host, { speaker }),
  onMapService: ({ service, host, speaker }) => mapHealerFlow.run(service, host, { speaker }),
  onDoor: (payload) => adventureFlow?.openDoorFromMap(payload),
  onRespawnDiscovery: ({ mapId }) => discoverMapRelay(mapId),
  onMapChange: () => syncMapQuickActions()
});

combatController = new CombatController({
  actionDefinitions,
  baseProgression,
  build,
  combatScreen,
  creature,
  encounter,
  encounterAffix,
  getActiveHuntAffix: () => activeHuntAffix(),
  getActiveHumanAffix: () => activeHumanAffix(),
  heroName,
  getUnspentXp: () => unspentXp(),
  inventoryModalShield,
  logNode,
  onCombatReadyToContinue: (result) => adventureFlow?.waitForAdventureContinue(result),
  objectivesData,
  setOwnedHuntAffixes: (affixes) => briefingScreen.setOwnedHuntAffixes(affixes),
  t
});

function creatureName() {
  return t(creature.nameKey);
}

function humanOpponentName() {
  return t(humanBriefingScreen.enemy?.nameKey ?? humanEnemy.nameKey);
}

function combatOpponentName() {
  return adventureFlow?.getCombatContext() === "human" ? humanOpponentName() : creatureName();
}

function activeHuntAffix() {
  return briefingScreen.activeHuntAffix();
}

function activeHumanAffix() {
  return humanBriefingScreen.activeInstinct();
}

function objectiveLabel(objective) {
  return t(objective.labelKey);
}

const inventoryDesktopQuery = window.matchMedia("(min-width: 761px)");
const viewportFit = createViewportFit({ appNode, body: document.body });
const { mobileFitQuery } = viewportFit;
const scheduleViewportFit = viewportFit.schedule;

let mapQuickActionsFreezeTimer = null;
let mapPopulationModal = null;
let mapRadarModalController = null;

function setMapQuickActionsDisabled(disabled) {
  [mapPopulationButton, mapRadarButton, mapInventoryButton, mapCreaturesButton].forEach((button) => {
    button.disabled = disabled;
  });
}

function syncMapQuickActions() {
  if (!mapPopulationButton || !mapScreen) return;
  mapPopulationButton.hidden = !mapScreen.isMinimapAvailable();
  mapRadarButton.hidden = !hasCompletedChadTrainingCombat();
}

function freezeMapQuickActions(duration = mapQuickActionsFreezeMs) {
  window.clearTimeout(mapQuickActionsFreezeTimer);
  setMapQuickActionsDisabled(true);
  mapQuickActionsFreezeTimer = window.setTimeout(() => {
    setMapQuickActionsDisabled(false);
    mapQuickActionsFreezeTimer = null;
  }, duration);
}

function currentHeroStatus() {
  const combat = combatController?.getCombat();
  const combatHero = combat?.hero;
  if (combatHero && !combat.ended) {
    return {
      hp: combatHero.hp,
      maxHp: combatHero.maxHp
    };
  }
  const maxHp = baseProgression.heroMaxHp ?? build.vitality;
  return {
    hp: baseProgression.heroHp ?? maxHp,
    maxHp
  };
}

function isMapInventoryItemEffective(item) {
  if (!["halfHeal", "fullHeal"].includes(item.effect)) return false;
  const hero = currentHeroStatus();
  return hero.hp < hero.maxHp;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function applyMapInventoryItem(entry) {
  if (!entry || !isMapInventoryItemEffective(entry.item)) {
    inventoryModal.showItemWarning(entry?.item?.id);
    return;
  }
  const hero = currentHeroStatus();
  const heal = entry.item.effect === "fullHeal"
    ? hero.maxHp
    : Math.max(1, Math.ceil(hero.maxHp / 2));
  baseProgression.heroMaxHp = hero.maxHp;
  const targetHp = Math.min(hero.maxHp, hero.hp + heal);
  baseProgression.inventory[entry.item.id] = Math.max(0, (baseProgression.inventory[entry.item.id] ?? 0) - 1);
  inventoryModal.renderItems();
  for (let hp = hero.hp + 1; hp <= targetHp; hp += 1) {
    baseProgression.heroHp = hp;
    inventoryModal.renderHeader();
    await wait(220);
  }
  inventoryModal.close();
  renderAll();
}

function isInventoryCombatContext(mode = inventoryModal?.mode) {
  const combat = combatController?.getCombat();
  return mode === "combat" && Boolean(combat) && !combat.ended;
}

const inventoryModal = new InventoryModal({
  shield: inventoryModalShield,
  closeButton: inventoryModalClose,
  optionsButton: inventoryModalOptions,
  itemsNode: inventoryItemsNode,
  headerNodes: {
    heroHpLabel: inventoryHeroHpLabel,
    heroHpText: inventoryHeroHpText,
    heroHpBar: inventoryHeroHpBar,
    goldText: inventoryGoldText,
    starsText: inventoryStarsText,
    gemsText: inventoryGemsText
  },
  t,
  getEntries: () => combatController.combatInventoryItems(),
  getActionPoints: () => combatController.getCombat()?.hero.pa ?? 0,
  getHeroStatus: () => currentHeroStatus(),
  getHeroName: () => heroName,
  getCurrencies: () => ({
    gold: baseProgression.gold ?? 0,
    stars: baseProgression.stars ?? 0,
    gems: baseProgression.availableXp ?? 0
  }),
  isItemEffective: (item) => isInventoryCombatContext()
    ? combatController.isCombatItemEffective(item)
    : isMapInventoryItemEffective(item),
  onApply: (entry, { mode } = {}) => {
    if (isInventoryCombatContext(mode)) {
      combatController.applyCombatItem(entry);
      return;
    }
    applyMapInventoryItem(entry);
  },
  onOptions: () => screenRouter.show(gameScreens.start)
});
combatController.setInventoryModal(inventoryModal);

mapPopulationModal = new MapPopulationModal({
  shield: mapPopulationModalShield,
  modal: mapPopulationModalNode,
  title: mapPopulationModalTitle,
  description: mapPopulationModalDescription,
  canvas: mapPopulationCanvas,
  legend: mapPopulationLegend,
  closeButton: mapPopulationModalClose,
  t,
  getMapModel: () => mapScreen.load().then(() => mapScreen.getMinimapModel()),
  getZonePopulation: (zone) => mapZonePopulation(baseProgression, zone)
});

mapRadarModalController = new MapRadarModal({
  nodes: {
    shield: mapRadarModalShield,
    modal: mapRadarModal,
    radarCanvas: mapRadarCanvas,
    statsNode: mapRadarStats,
    pointsLeft: mapRadarPointsLeft,
    pointsUnit: mapRadarPointsUnit,
    resetBuildButton: mapRadarResetBuild,
    closeButton: mapRadarModalClose,
    statModal: mapRadarStatModal,
    statModalTitle: mapRadarStatModalTitle,
    statModalDescription: mapRadarStatModalDescription,
    statModalPoints: mapRadarStatModalPoints,
    statModalClose: mapRadarStatModalClose,
    statModalShield: mapRadarStatModalShield
  },
  t,
  stats: playerRadarStatDefinitions,
  build,
  initialBuild,
  resetBuild: committedBuild,
  totalPoints: baseProgression.availableXp,
  isLocked: () => adventureFlow?.isGameStarted() ?? false,
  onChange: () => renderAll(),
  onReset: () => resetBuildSequence(),
  onClose: () => {
    commitBuildSequence();
    renderAll();
  }
});

bindPress(mapPopulationButton, () => mapPopulationModal.open());
bindPress(mapRadarButton, () => mapRadarModalController.open());
bindPress(mapInventoryButton, () => inventoryModal.open({ mode: "map" }));
bindPress(mapCreaturesButton, () => humanBriefingScreen.openOwnedCreatures());

function hasCompletedChadTrainingCombat() {
  return baseProgression.completedTrainerBattleIds?.includes("chad") ?? false;
}

function collectMapChestReward(chest) {
  baseProgression.openedMapFlags ??= [];
  if (!baseProgression.openedMapFlags.includes(chest.openedFlag)) {
    baseProgression.openedMapFlags.push(chest.openedFlag);
  }
  if (chest.contentType === "creature") {
    queuedCaptureEncounterState = createCaptureEncounterState({
      progression: baseProgression,
      levelRange: { minLevel: 1, maxLevel: 2 }
    });
    const creatureName = t(queuedCaptureEncounterState.creature.nameKey);
    return openMapRewardModal({
      title: "Oh non !",
      description: `${creatureName} était caché dans le coffre !`,
      okLabel: "OK"
    }).then(() => adventureFlow?.openHuntBriefingFromMap(null));
  }
  return openMapRewardModal({
    title: "Félicitations !",
    description: "Vous avez trouvé 1 gemme !",
    okLabel: "OK"
  }).then(() => {
    baseProgression.availableXp += chest.quantity;
    renderAll();
  });
}

async function discoverMapRelay(mapId) {
  await playWhiteFlash(encounterTransition, { boundsNode: mapSection });
  await openMapRewardModal({
    title: t("map.relay.discovery_title"),
    description: t("map.relay.discovery_description", {
      map: t(`map.name.${mapId}`)
    }),
    okLabel: t("ui.ok")
  });
}

function openMapRewardModal({ title, description, okLabel }) {
  if (!mapRewardModal || !mapRewardModalShield || !mapRewardModalOk) return Promise.resolve();
  mapRewardModalTitle.textContent = title;
  mapRewardModalDescription.textContent = description;
  setPixelButtonLabel(mapRewardModalOk, okLabel);
  mapRewardModalShield.hidden = false;
  mapRewardModal.hidden = false;
  mapRewardModalOk.focus({ preventScroll: true });
  return new Promise((resolve) => {
    let unbindOk = null;
    const close = () => {
      unbindOk?.();
      mapRewardModal.hidden = true;
      mapRewardModalShield.hidden = true;
      resolve();
    };
    unbindOk = bindPress(mapRewardModalOk, close);
  });
}

adventureFlow = createAdventureFlow({
  briefingScreen,
  combatController,
  humanBriefingScreen,
  inventoryModal,
  freezeMapQuickActions,
  isMobile: () => mobileFitQuery.matches,
  mapScreen,
  hasCompletedTraining: (enemyId) => baseProgression.completedTrainerBattleIds?.includes(enemyId) ?? false,
  onCaptureCompleted: (zone) => {
    consumeMapZoneCapture(baseProgression, zone);
  },
  onMapVisited: (mapId) => {
    recordVisitedWorldMap(baseProgression, mapId);
  },
  onTrainingCompleted: (enemyId) => {
    baseProgression.completedTrainerBattleIds ??= [];
    if (!baseProgression.completedTrainerBattleIds.includes(enemyId)) {
      baseProgression.completedTrainerBattleIds.push(enemyId);
    }
  },
  prepareNextHumanCombat,
  prepareNextHunt,
  renderAll,
  screenRouter,
  transitionNode: encounterTransition
});

combatLauncher = createCombatLauncher({
  adventureFlow,
  combatController,
  combatScreen,
  scheduleViewportFit,
  screenRouter
});

staticTextRenderer = createStaticTextRenderer({
  combatScreen,
  getCombatOpponentName: () => combatOpponentName(),
  nodes: {
    chooseCreatureHuntButton,
    chooseHumanCombatButton,
    chooseMapButton,
    mapCreaturesButton,
    mapInventoryButton,
    mapPopulationButton,
    mapRadarButton,
    orientationPrompt,
    orientationTitle,
    startChoiceTitle
  },
  t
});

function renderAll() {
  briefingScreen.render();
  humanBriefingScreen.render();
  mapRadarModalController?.setTotalPoints(baseProgression.availableXp);
  mapRadarModalController?.render();
  syncMapQuickActions();
  staticTextRenderer.render();
  if (combatController.hasCombat()) {
    combatController.renderCombatUi();
  }
  scheduleViewportFit();
}

function resetBuildSequence() {
  Object.assign(build, committedBuild);
  renderAll();
  combatController.clearLog();
  combatController.addLog(t("log.build_reset"));
}

function commitBuildSequence() {
  Object.assign(committedBuild, build);
}

function startCaptureSequence() {
  commitBuildSequence();
  combatLauncher.start({
    context: "capture",
    screenConfig: {
      creature,
      objectives: objectivesData,
      context: "capture",
      visibleActionIds: ["entaille", "garde", "feinte", "art", "capture", "bag", "end"],
      showObjectives: true
    },
    controllerConfig: {
      context: "capture",
      creature,
      encounter,
      encounterAffix,
      objectivesData
    },
    renderBriefingStats: () => briefingScreen.renderStats()
  });
}

function startHumanCombatPrototype() {
  commitBuildSequence();
  const humanCombatBuild = humanBriefingScreen.combatBuild();
  const humanActionDefinitions = combatController.actionDefinitionsForBuild(humanCombatBuild);
  const activeHumanEnemy = humanBriefingScreen.enemy ?? humanEnemy;
  combatLauncher.start({
    context: "human",
    screenConfig: {
      creature: activeHumanEnemy,
      objectives: [],
      context: "human",
      visibleActionIds: ["signature", "entaille", "garde", "feinte", "art", "bag", "end"],
      showObjectives: false,
      actionDefinitions: humanActionDefinitions
    },
    controllerConfig: {
      context: "human",
      creature: activeHumanEnemy,
      encounter: humanEncounter,
      encounterAffix: null,
      objectivesData: [],
      buildOverride: humanCombatBuild
    },
    renderBriefingStats: () => humanBriefingScreen.renderStats()
  });
}

function prepareNextHumanCombat(enemyId = null) {
  humanEncounterState = createHumanEncounterState({ progression: baseProgression, enemyId });
  humanEncounter = humanEncounterState.encounter;
  humanEnemy = humanEncounterState.enemy;
  selectedHumanEncounterIntroKey = humanEncounterState.encounterIntroKey;

  humanBriefingScreen.configureEncounter({
    enemy: humanEnemy,
    encounterIntroKey: selectedHumanEncounterIntroKey,
    totalPoints: baseProgression.availableXp,
    enemyAdapter: ({ baseEnemy, playerBuild, playerBuildType, playerTeam }) => createAdaptiveHumanEncounterEnemy({
      enemy: baseEnemy,
      encounterScaling: humanEncounter?.scaling ?? 0,
      playerBaseBuild: build,
      playerBuild,
      playerBuildType,
      playerTeam
    })
  });
}

function prepareNextHunt(mapEncounterZone = null) {
  captureEncounterState = queuedCaptureEncounterState
    ?? createCaptureEncounterState({
      progression: baseProgression,
      mapEncounterZone
    });
  queuedCaptureEncounterState = null;
  encounter = captureEncounterState.encounter;
  creature = captureEncounterState.creature;
  encounterAffix = captureEncounterState.encounterAffix;
  ownedHuntAffixes = captureEncounterState.ownedHuntAffixes;
  selectedEncounterIntroKey = captureEncounterState.encounterIntroKey;
  objectivesData = captureEncounterState.objectives;

  briefingScreen.configureEncounter({
    creature,
    encounterIntroKey: selectedEncounterIntroKey,
    objectives: objectivesData,
    encounterAffix,
    ownedHuntAffixes,
    selectedHuntAffixId: baseProgression.preparedHuntAffixId,
    totalPoints: baseProgression.availableXp
  });
  combatScreen.configureEncounter({ creature, objectives: objectivesData });
  combatController.configureEncounter({ creature, encounter, encounterAffix, objectivesData });
}

viewportFit.addListeners();
inventoryDesktopQuery.addEventListener("change", () => {
  inventoryModal.close();
  if (combatController.hasCombat()) combatController.renderCombatUi();
});

chooseCreatureHuntButton.addEventListener("click", () => {
  adventureFlow.openHuntBriefingFromMenu();
});

chooseHumanCombatButton.addEventListener("click", () => {
  adventureFlow.openHumanBriefingFromMenu();
});

chooseMapButton.addEventListener("click", () => {
  adventureFlow.openMapFromMenu();
});

if (document.fonts) {
  document.fonts.ready.then(scheduleViewportFit);
}

window.setPrototypeLanguage = (language) => i18n.setLanguage(language);
validateLocales();
screenRouter.show(gameScreens.start);
renderAll();
scheduleViewportFit();
combatController.addLog(t("log.initial"));
