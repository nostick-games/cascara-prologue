import { gameScreens } from "./screenRouter.js";

export function createCombatLauncher({
  adventureFlow,
  combatController,
  combatScreen,
  scheduleViewportFit,
  screenRouter
}) {
  function start({
    context,
    controllerConfig,
    screenConfig,
    renderBriefingStats
  }) {
    adventureFlow.markCombatStarted(context);
    combatScreen.configureEncounter(screenConfig);
    combatController.configureEncounter(controllerConfig);
    screenRouter.show(gameScreens.combat);
    window.scrollTo({ top: 0, behavior: "auto" });
    combatScreen.showUi();
    combatController.clearLog();
    renderBriefingStats();
    combatScreen.boot();
    scheduleViewportFit();
    setTimeout(() => combatController.startCombat(), 120);
  }

  return { start };
}
