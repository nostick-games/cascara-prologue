import { gameScreens } from "./screenRouter.js";
import {
  cleanupEncounterTransition,
  playDefeatFadeToBlack,
  playEncounterTransition,
  playMapFadeFromBlack,
  playMapFadeToBlack,
  playRespawnReveal
} from "./encounterTransition.js";
import { aragorObjectName, caveOpenLayerName } from "../screens/map/mapConfig.js";

export function createAdventureFlow({
  briefingScreen,
  combatController,
  humanBriefingScreen,
  inventoryModal,
  freezeMapQuickActions = () => {},
  isMobile,
  mapScreen,
  hasCompletedTraining = () => false,
  onCaptureCompleted = () => {},
  onMapVisited = () => {},
  onTrainingCompleted = () => {},
  prepareNextHumanCombat,
  prepareNextHunt,
  renderAll,
  screenRouter,
  transitionNode
}) {
  const heroName = "Houdini";
  let gameStarted = false;
  let awaitingAdventureContinue = false;
  let combatContext = "capture";
  let huntBriefingSource = "menu";
  let humanBriefingSource = "menu";
  let activeMapEncounterZone = null;

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function activeGameBoundsNode() {
    return document.querySelector("#combatSection:not([hidden])")
      ?? document.querySelector("#prepSection:not([hidden])")
      ?? document.querySelector("#humanBriefingSection:not([hidden])")
      ?? mapScreen.nodes.section;
  }

  async function playDefeatRespawnTransition() {
    await playDefeatFadeToBlack(transitionNode, {
      boundsNode: activeGameBoundsNode()
    });
    screenRouter.show(gameScreens.map);
    scrollTop();
    await mapScreen.resumeFromEncounter();
    mapScreen.respawnHero();
    combatController.restoreHeroHpForRespawn();
    renderAll();
    const center = mapScreen.heroScreenPosition();
    const bounds = mapScreen.nodes.section.getBoundingClientRect();
    await Promise.all([
      mapScreen.playHeroRespawnAnimation?.(1200),
      playRespawnReveal(transitionNode, {
        boundsNode: mapScreen.nodes.section,
        center: {
          x: center.x - bounds.left,
          y: center.y - bounds.top
        }
      })
    ]);
  }

  function isGameStarted() {
    return gameStarted;
  }

  function getCombatContext() {
    return combatContext;
  }

  function markCombatStarted(context) {
    gameStarted = true;
    combatContext = context;
    awaitingAdventureContinue = false;
  }

  function openHuntBriefingFromMenu() {
    gameStarted = false;
    huntBriefingSource = "menu";
    screenRouter.show(gameScreens.huntBriefing);
    renderAll();
    briefingScreen.playRadarIntro();
    scrollTop();
  }

  async function openHuntBriefingFromMap(mapEncounterZone = null) {
    huntBriefingSource = "map";
    activeMapEncounterZone = mapEncounterZone;
    gameStarted = false;
    prepareNextHunt(mapEncounterZone);
    await playEncounterTransition(transitionNode, {
      boundsNode: mapScreen.nodes.section,
      keepVisible: true
    });
    screenRouter.show(gameScreens.huntBriefing);
    renderAll();
    cleanupEncounterTransition(transitionNode);
    briefingScreen.playRadarIntro();
    scrollTop();
  }

  function openHumanBriefingFromMenu() {
    gameStarted = false;
    humanBriefingSource = "menu";
    prepareNextHumanCombat();
    screenRouter.show(gameScreens.humanBriefing);
    renderAll();
    humanBriefingScreen.playRadarIntro();
    scrollTop();
  }

  function openMapFromMenu() {
    gameStarted = false;
    huntBriefingSource = "map";
    activeMapEncounterZone = null;
    onMapVisited("prologue");
    screenRouter.show(gameScreens.map);
    renderAll();
    scrollTop();
    mapScreen.start({ reset: true });
  }

  async function openDoorFromMap(door) {
    gameStarted = false;
    await playMapFadeToBlack(transitionNode, {
      boundsNode: mapScreen.nodes.section
    });
    await mapScreen.loadMap(door.targetMap, {
      spawnId: door.targetSpawn,
      direction: door.direction
    });
    onMapVisited(door.targetMap);
    screenRouter.show(gameScreens.map);
    renderAll();
    scrollTop();
    await mapScreen.start();
    await playMapFadeFromBlack(transitionNode, {
      boundsNode: mapScreen.nodes.section
    });
  }

  async function openHumanEncounterFromMap(payload = {}) {
    const enemyId = payload.id ?? null;
    const skipChallenge = payload.skipChallenge === true;
    gameStarted = false;
    humanBriefingSource = "map";
    prepareNextHumanCombat(enemyId);
    const opponent = humanBriefingScreen.enemy ? humanBriefingScreen.t(humanBriefingScreen.enemy.nameKey) : "Aragor";
    const mapDialog = humanBriefingScreen.enemy?.mapDialog ?? {};
    if (mapScreen.isHumanEncounterDefeated?.(enemyId) && mapDialog.defeatedKey) {
      await mapScreen.playMessageDialog({
        message: humanBriefingScreen.t(mapDialog.defeatedKey, { opponent, hero: heroName }),
        messageHighlights: [opponent]
      });
      mapScreen.resumeFromEncounter().then(() => mapScreen.animateHeroAwayFromHumanEncounter(enemyId));
      return;
    }
    const requiredOwnedCreatureCount = mapDialog.requiredOwnedCreatureCount ?? 0;
    const hasRequiredTeam = humanBriefingScreen.ownedCreatureCount() >= requiredOwnedCreatureCount;
    if (!hasRequiredTeam) {
      await mapScreen.playMessageDialog({
        message: humanBriefingScreen.t(mapDialog.needTeamKey ?? "map.aragor.need_team"),
        messageHighlights: [opponent]
      });
      mapScreen.resumeFromEncounter().then(() => mapScreen.animateHeroAwayFromHumanEncounter());
      return;
    }

    if (!skipChallenge) {
      const choice = await mapScreen.playChoiceDialog({
        message: humanBriefingScreen.t(mapDialog.challengeKey ?? "map.aragor.challenge", { hero: heroName, opponent }),
        prompt: humanBriefingScreen.t(mapDialog.fightQuestionKey ?? "map.aragor.fight_question", { opponent }),
        messageHighlights: [opponent],
        promptHighlights: [opponent],
        options: [
          { label: humanBriefingScreen.t(mapDialog.yesLabelKey ?? "ui.choice.yes"), value: "yes" },
          { label: humanBriefingScreen.t(mapDialog.noLabelKey ?? "ui.choice.no"), value: "no" }
        ]
      });
      if (choice !== "yes") {
        mapScreen.resumeFromEncounter().then(() => mapScreen.animateHeroAwayFromHumanEncounter());
        return;
      }
    }
    await playEncounterTransition(transitionNode, {
      boundsNode: mapScreen.nodes.section,
      keepVisible: true
    });
    screenRouter.show(gameScreens.humanBriefing);
    renderAll();
    cleanupEncounterTransition(transitionNode);
    humanBriefingScreen.playRadarIntro();
    scrollTop();
  }

  async function returnToMapFromHunt(result = null) {
    combatController.clearLog();
    renderAll();
    if (result?.outcome === "defeat") {
      await playDefeatRespawnTransition();
      return;
    }
    if (isMobile()) {
      freezeMapQuickActions();
    }
    screenRouter.show(gameScreens.map);
    scrollTop();
    mapScreen.resumeFromEncounter();
  }

  function fleeHuntBriefing() {
    briefingScreen.closeModal();
    if (huntBriefingSource === "map") {
      returnToMapFromHunt();
      return;
    }
    screenRouter.show(gameScreens.start);
    renderAll();
  }

  async function returnToMapFromHumanCombat(result) {
    combatController.clearLog();
    if (result?.training) {
      const alreadyCompleted = hasCompletedTraining(result.creatureId);
      const returnDialogKey = alreadyCompleted
        ? humanBriefingScreen.enemy?.training?.returnDialogKey
        : humanBriefingScreen.enemy?.training?.firstReturnDialogKey;
      onTrainingCompleted(result.creatureId);
      renderAll();
      screenRouter.show(gameScreens.map);
      scrollTop();
      await mapScreen.resumeFromEncounter();
      const opponent = humanBriefingScreen.enemy ? humanBriefingScreen.t(humanBriefingScreen.enemy.nameKey) : "Chad";
      await mapScreen.playMessageDialog({
        message: humanBriefingScreen.t(
          returnDialogKey ?? "map.npc.chad.after_training",
          { opponent, hero: heroName }
        ),
        messageHighlights: [opponent, heroName]
      });
      return;
    }
    renderAll();
    if (result?.won) {
      const mapDialog = humanBriefingScreen.enemy?.mapDialog ?? {};
      if (mapDialog.defeatBehavior === "dialogThenFade") {
        screenRouter.show(gameScreens.map);
        scrollTop();
        await mapScreen.resumeFromEncounter();
        const opponent = humanBriefingScreen.enemy ? humanBriefingScreen.t(humanBriefingScreen.enemy.nameKey) : "";
        if (mapDialog.defeatedKey) {
          await mapScreen.playMessageDialog({
            message: humanBriefingScreen.t(mapDialog.defeatedKey, { opponent, hero: heroName }),
            messageHighlights: [opponent, heroName]
          });
        }
        if (result.creatureId === aragorObjectName) {
          mapScreen.holdTileLayer(caveOpenLayerName, 0);
        }
        await mapScreen.fadeHumanEncounter(result.creatureId);
        if (result.creatureId === aragorObjectName) {
          await mapScreen.playMessageDialog({
            message: humanBriefingScreen.t("map.aragor.cave_open")
          });
          await mapScreen.fadeTileLayer(caveOpenLayerName, 1200, { from: 0, to: 1 });
        }
        return;
      }
      if (mapDialog.defeatBehavior === "stay") {
        mapScreen.markHumanEncounterDefeated(result.creatureId);
      } else {
        mapScreen.clearHumanEncounter(result.creatureId);
      }
    } else if (result?.outcome === "defeat") {
      await playDefeatRespawnTransition();
      return;
    }
    screenRouter.show(gameScreens.map);
    scrollTop();
    mapScreen.resumeFromEncounter();
  }

  async function continueAdventureFromCombat(result) {
    awaitingAdventureContinue = false;
    gameStarted = false;
    inventoryModal.close();
    briefingScreen.closeModal();
    if (combatContext === "human") {
      if (humanBriefingSource === "map") {
        await returnToMapFromHumanCombat(result);
        return;
      }
      prepareNextHumanCombat();
      combatController.clearLog();
      renderAll();
      screenRouter.show(gameScreens.humanBriefing);
      humanBriefingScreen.playRadarIntro();
      scrollTop();
      return;
    }
    if (huntBriefingSource === "map") {
      if (result?.context === "capture" && result?.won && result?.outcome === "capture") {
        onCaptureCompleted(activeMapEncounterZone);
      }
      await returnToMapFromHunt(result);
      return;
    }
    prepareNextHunt();
    combatController.clearLog();
    renderAll();
    screenRouter.show(gameScreens.huntBriefing);
    briefingScreen.playRadarIntro();
    scrollTop();
  }

  function waitForAdventureContinue(result = null) {
    if (awaitingAdventureContinue) return;
    awaitingAdventureContinue = true;
    const eventName = isMobile() ? "pointerdown" : "keydown";
    const handler = () => {
      window.removeEventListener(eventName, handler, true);
      void continueAdventureFromCombat(result);
    };
    window.addEventListener(eventName, handler, true);
  }

  return {
    fleeHuntBriefing,
    getCombatContext,
    isGameStarted,
    markCombatStarted,
    openHumanBriefingFromMenu,
    openHumanEncounterFromMap,
    openDoorFromMap,
    openHuntBriefingFromMap,
    openHuntBriefingFromMenu,
    openMapFromMenu,
    waitForAdventureContinue
  };
}
