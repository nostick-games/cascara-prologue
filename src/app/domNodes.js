export function queryDomNodes(root = document) {
  const radarCanvas = root.querySelector("#radar");
  const statsNode = root.querySelector("#stats");
  const radarModal = root.querySelector("#radarModal");
  const radarModalTitle = root.querySelector("#radarModalTitle");
  const radarModalDescription = root.querySelector("#radarModalDescription");
  const radarModalPoints = root.querySelector("#radarModalPoints");
  const radarModalClose = root.querySelector("#radarModalClose");
  const radarModalShield = root.querySelector("#radarModalShield");
  const pointsLeftNode = root.querySelector("#pointsLeft");
  const pointsUnitNode = root.querySelector("#pointsUnit");
  const appNode = root.querySelector(".app");
  const startSection = root.querySelector("#startSection");
  const startChoiceTitle = root.querySelector("#startChoiceTitle");
  const chooseCreatureHuntButton = root.querySelector("#chooseCreatureHunt");
  const chooseHumanCombatButton = root.querySelector("#chooseHumanCombat");
  const chooseMapButton = root.querySelector("#chooseMap");
  const optionsSection = root.querySelector("#optionsSection");
  const optionsSaveButton = root.querySelector("#optionsSaveButton");
  const optionsSaveGauge = root.querySelector("#optionsSaveGauge");
  const optionsSaveGaugeFill = root.querySelector("#optionsSaveGaugeFill");
  const optionsSaveStatus = root.querySelector("#optionsSaveStatus");
  const optionsLoadButton = root.querySelector("#optionsLoadButton");
  const optionsLoadStatus = root.querySelector("#optionsLoadStatus");
  const optionsJoystickFixedButton = root.querySelector("#optionsJoystickFixedButton");
  const optionsJoystickMovableButton = root.querySelector("#optionsJoystickMovableButton");
  const optionsBackButton = root.querySelector("#optionsBackButton");
  const mapSection = root.querySelector("#mapSection");
  const mapCanvas = root.querySelector("#mapCanvas");
  const mapPopulationButton = root.querySelector("#mapPopulationButton");
  const mapRadarButton = root.querySelector("#mapRadarButton");
  const mapRadarModalShield = root.querySelector("#mapRadarModalShield");
  const mapRadarModal = root.querySelector("#mapRadarModal");
  const mapRadarCanvas = root.querySelector("#mapRadarCanvas");
  const mapRadarStats = root.querySelector("#mapRadarStats");
  const mapRadarPointsLeft = root.querySelector("#mapRadarPointsLeft");
  const mapRadarPointsUnit = root.querySelector("#mapRadarPointsUnit");
  const mapRadarResetBuild = root.querySelector("#mapRadarResetBuild");
  const mapRadarModalClose = root.querySelector("#mapRadarModalClose");
  const mapRadarStatModal = root.querySelector("#mapRadarStatModal");
  const mapRadarStatModalTitle = root.querySelector("#mapRadarStatModalTitle");
  const mapRadarStatModalDescription = root.querySelector("#mapRadarStatModalDescription");
  const mapRadarStatModalPoints = root.querySelector("#mapRadarStatModalPoints");
  const mapRadarStatModalClose = root.querySelector("#mapRadarStatModalClose");
  const mapRadarStatModalShield = root.querySelector("#mapRadarStatModalShield");
  const mapPopulationModalShield = root.querySelector("#mapPopulationModalShield");
  const mapPopulationModal = root.querySelector("#mapPopulationModal");
  const mapPopulationModalTitle = root.querySelector("#mapPopulationModalTitle");
  const mapPopulationModalDescription = root.querySelector("#mapPopulationModalDescription");
  const mapPopulationCanvas = root.querySelector("#mapPopulationCanvas");
  const mapPopulationLegend = root.querySelector("#mapPopulationLegend");
  const mapPopulationModalClose = root.querySelector("#mapPopulationModalClose");
  const mapRewardModalShield = root.querySelector("#mapRewardModalShield");
  const mapRewardModal = root.querySelector("#mapRewardModal");
  const mapRewardModalTitle = root.querySelector("#mapRewardModalTitle");
  const mapRewardModalDescription = root.querySelector("#mapRewardModalDescription");
  const mapRewardModalOk = root.querySelector("#mapRewardModalOk");
  const mapInventoryButton = root.querySelector("#mapInventoryButton");
  const mapCreaturesButton = root.querySelector("#mapCreaturesButton");
  const mapJoystick = root.querySelector("#mapJoystick");
  const mapJoystickBase = root.querySelector("#mapJoystick .map-joystick-base");
  const mapJoystickStick = root.querySelector("#mapJoystickStick");
  const mapDialogFrame = root.querySelector("#mapDialogFrame");
  const mapDialogLog = root.querySelector("#mapDialogLog");
  const mapChoicePanel = root.querySelector("#mapChoicePanel");
  const mapChoiceList = root.querySelector("#mapChoiceList");
  const encounterTransition = root.querySelector("#encounterTransition");
  const startCaptureButton = root.querySelector("#startCapture");
  const resetBuildButton = root.querySelector("#resetBuild");
  const affixButton = root.querySelector("#affixButton");
  const fleeButton = root.querySelector("#fleeButton");
  const prepSection = root.querySelector("#prepSection");
  const humanBriefingSection = root.querySelector("#humanBriefingSection");
  const combatSection = root.querySelector("#combatSection");
  const encounterSentenceNode = root.querySelector("#encounterSentence");
  const creatureStage = root.querySelector("#creatureStage");
  const creatureSprite = root.querySelector("#creatureSprite");
  const huntCreatureType = root.querySelector("#huntCreatureType");
  const huntCreatureLevel = root.querySelector("#huntCreatureLevel");
  const behaviorButton = root.querySelector("#behaviorButton");
  const rewardsButton = root.querySelector("#rewardsButton");
  const captureConditionsButton = root.querySelector("#captureConditionsButton");
  const briefingModal = root.querySelector("#briefingModal");
  const briefingModalShield = root.querySelector("#briefingModalShield");
  const briefingModalTitle = root.querySelector("#briefingModalTitle");
  const briefingModalDescription = root.querySelector("#briefingModalDescription");
  const briefingModalObjectives = root.querySelector("#briefingModalObjectives");
  const briefingModalClose = root.querySelector("#briefingModalClose");
  const phaseCover = root.querySelector("#phaseCover");
  const combatUi = root.querySelector("#combatUi");
  const logNode = root.querySelector("#log");
  const actionButtons = [...root.querySelectorAll("[data-action]")];
  const battleStage = root.querySelector("#battleStage");
  const enemySprite = root.querySelector("#enemySprite");
  const heroSprite = root.querySelector("#heroSprite");
  const inventoryModalShield = root.querySelector("#inventoryModalShield");
  const inventoryModalClose = root.querySelector("#inventoryModalClose");
  const inventoryModalOptions = root.querySelector("#inventoryModalOptions");
  const inventoryItemsNode = root.querySelector("#inventoryItems");
  const inventoryHeroHpLabel = root.querySelector("#inventoryHeroHpLabel");
  const inventoryHeroHpText = root.querySelector("#inventoryHeroHpText");
  const inventoryHeroHpBar = root.querySelector("#inventoryHeroHpBar");
  const inventoryGoldText = root.querySelector("#inventoryGoldText");
  const inventoryStarsText = root.querySelector("#inventoryStarsText");
  const inventoryGemsText = root.querySelector("#inventoryGemsText");
  const orientationTitle = root.querySelector("#orientationTitle");
  const orientationPrompt = root.querySelector("#orientationPrompt");
  const radarTitle = root.querySelector("#radarTitle");
  const humanRadarCanvas = root.querySelector("#humanRadar");
  const humanStatsNode = root.querySelector("#humanStats");
  const humanRadarModal = root.querySelector("#humanRadarModal");
  const humanRadarModalTitle = root.querySelector("#humanRadarModalTitle");
  const humanRadarModalDescription = root.querySelector("#humanRadarModalDescription");
  const humanRadarModalPoints = root.querySelector("#humanRadarModalPoints");
  const humanRadarModalClose = root.querySelector("#humanRadarModalClose");
  const humanRadarModalShield = root.querySelector("#humanRadarModalShield");
  const humanPointsLeftNode = root.querySelector("#humanPointsLeft");
  const humanPointsUnitNode = root.querySelector("#humanPointsUnit");
  const humanResetBuildButton = root.querySelector("#humanResetBuild");
  const startHumanCombatButton = root.querySelector("#startHumanCombat");
  const humanEncounterSentenceNode = root.querySelector("#humanEncounterSentence");
  const humanStage = root.querySelector("#humanStage");
  const humanSprite = root.querySelector("#humanSprite");
  const humanEnemyRadarButton = root.querySelector("#humanEnemyRadarButton");
  const humanEnemyTeamSlots = root.querySelector("#humanEnemyTeamSlots");
  const humanEnemyRadarModalShield = root.querySelector("#humanEnemyRadarModalShield");
  const humanEnemyRadarModal = root.querySelector("#humanEnemyRadarModal");
  const humanEnemyRadarModalTitle = root.querySelector("#humanEnemyRadarModalTitle");
  const humanEnemyRadarModalDescription = root.querySelector("#humanEnemyRadarModalDescription");
  const humanEnemyRadarCanvas = root.querySelector("#humanEnemyRadarCanvas");
  const humanEnemyRadarModalClose = root.querySelector("#humanEnemyRadarModalClose");
  const humanEnemyTeamModalShield = root.querySelector("#humanEnemyTeamModalShield");
  const humanEnemyTeamModal = root.querySelector("#humanEnemyTeamModal");
  const humanEnemyTeamModalTitle = root.querySelector("#humanEnemyTeamModalTitle");
  const humanEnemyTeamModalList = root.querySelector("#humanEnemyTeamModalList");
  const humanEnemyTeamModalClose = root.querySelector("#humanEnemyTeamModalClose");
  const humanRadarTitle = root.querySelector("#humanRadarTitle");
  const humanRosterSlots = [...root.querySelectorAll("#humanRosterSlots .roster-slot")];
  const humanInstinctButton = root.querySelector("#humanInstinctButton");
  const instinctModalShield = root.querySelector("#instinctModalShield");
  const instinctModal = root.querySelector("#instinctModal");
  const instinctModalTitle = root.querySelector("#instinctModalTitle");
  const instinctModalPrompt = root.querySelector("#instinctModalPrompt");
  const instinctModalList = root.querySelector("#instinctModalList");
  const instinctModalClose = root.querySelector("#instinctModalClose");

  const combatNodes = {
    combatSection,
    phaseCover,
    combatUi,
    combatActions: root.querySelector(".combat-actions"),
    actionButtons,
    battleStage,
    enemySprite,
    heroSprite,
    inventoryModalClose,
    loadingDuelTitle: root.querySelector("#loadingDuelTitle"),
    loadingDuelDescription: root.querySelector("#loadingDuelDescription"),
    heroBarLabel: root.querySelector("#heroBarLabel"),
    guardBarLabel: root.querySelector("#guardBarLabel"),
    enemyBarLabel: root.querySelector("#enemyBarLabel"),
    enemyGuardBarLabel: root.querySelector("#enemyGuardBarLabel"),
    combatObjectivesTitle: root.querySelector("#combatObjectivesTitle"),
    heroHpText: root.querySelector("#heroHpText"),
    heroHpBar: root.querySelector("#heroHpBar"),
    guardText: root.querySelector("#guardText"),
    guardBar: root.querySelector("#guardBar"),
    enemyHpText: root.querySelector("#enemyHpText"),
    enemyHpBar: root.querySelector("#enemyHpBar"),
    enemyGuardText: root.querySelector("#enemyGuardText"),
    enemyGuardBar: root.querySelector("#enemyGuardBar"),
    heroPaDots: root.querySelector("#paDots"),
    enemyPaDots: root.querySelector("#enemyPaDots"),
    combatObjectives: root.querySelector(".combat-objectives"),
    objectives: root.querySelector("#objectives")
  };

  return {
    actionButtons,
    affixButton,
    appNode,
    battleStage,
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
    combatUi,
    encounterSentenceNode,
    encounterTransition,
    enemySprite,
    fleeButton,
    heroSprite,
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
    humanEnemyTeamModal,
    humanEnemyTeamModalClose,
    humanEnemyTeamModalList,
    humanEnemyTeamModalShield,
    humanEnemyTeamModalTitle,
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
    huntCreatureLevel,
    huntCreatureType,
    humanStatsNode,
    instinctModal,
    instinctModalClose,
    instinctModalList,
    instinctModalPrompt,
    instinctModalShield,
    instinctModalTitle,
    inventoryItemsNode,
    inventoryHeroHpBar,
    inventoryHeroHpLabel,
    inventoryHeroHpText,
    inventoryGoldText,
    inventoryStarsText,
    inventoryGemsText,
    inventoryModalClose,
    inventoryModalOptions,
    inventoryModalShield,
    logNode,
    mapCanvas,
    mapCreaturesButton,
    mapDialogFrame,
    mapDialogLog,
    mapChoiceList,
    mapChoicePanel,
    mapInventoryButton,
    mapJoystick,
    mapJoystickBase,
    mapJoystickStick,
    mapPopulationButton,
    mapPopulationCanvas,
    mapPopulationLegend,
    mapPopulationModal,
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
    optionsBackButton,
    optionsJoystickFixedButton,
    optionsJoystickMovableButton,
    optionsLoadButton,
    optionsLoadStatus,
    optionsSaveButton,
    optionsSaveGauge,
    optionsSaveGaugeFill,
    optionsSaveStatus,
    optionsSection,
    phaseCover,
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
  };
}
