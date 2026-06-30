import { setPixelButtonLabel } from "../ui/PixelButton.js";

export function createStaticTextRenderer({
  combatScreen,
  getCombatOpponentName,
  nodes,
  t
}) {
  function render() {
    document.title = t("ui.page_title");
    nodes.orientationTitle.textContent = t("ui.orientation.title");
    nodes.orientationPrompt.textContent = t("ui.orientation.prompt");
    setPixelButtonLabel(nodes.homeFrenchButton, t("ui.home.french"));
    setPixelButtonLabel(nodes.homeEnglishButton, t("ui.home.english"));
    setPixelButtonLabel(nodes.homeStartButton, t("ui.home.start"));
    setPixelButtonLabel(nodes.homeCheatButton, t("ui.home.cheat"));
    nodes.startChoiceTitle.textContent = t("ui.start_choice.title");
    setPixelButtonLabel(nodes.chooseCreatureHuntButton, t("ui.start_choice.creature"));
    setPixelButtonLabel(nodes.chooseHumanCombatButton, t("ui.start_choice.human"));
    setPixelButtonLabel(nodes.chooseMapButton, t("ui.start_choice.map"));
    setPixelButtonLabel(nodes.chooseTutorialButton, t("ui.start_choice.tutorial"));
    setPixelButtonLabel(nodes.chooseTutorialEpilogueButton, t("ui.start_choice.tutorial_epilogue"));
    setPixelButtonLabel(nodes.chooseLevelDemoButton, t("ui.start_choice.level_demo"));
    nodes.mapPopulationButton.setAttribute("aria-label", t("ui.map_population"));
    nodes.mapPopulationButton.title = t("ui.map_population");
    nodes.mapRadarButton.setAttribute("aria-label", t("ui.map_radar"));
    nodes.mapRadarButton.title = t("ui.map_radar");
    nodes.mapInventoryButton.setAttribute("aria-label", t("ui.map_inventory"));
    nodes.mapInventoryButton.title = t("ui.map_inventory");
    nodes.mapCreaturesButton.setAttribute("aria-label", t("ui.map_creatures"));
    nodes.mapCreaturesButton.title = t("ui.map_creatures");
    combatScreen.renderStaticText(getCombatOpponentName());
  }

  return { render };
}
