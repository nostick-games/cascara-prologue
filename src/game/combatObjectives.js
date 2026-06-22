import { applyCaptureProgress } from "./combatState.js";

export class CombatObjectives {
  constructor({ combatDebug, creatureName, getCombat, objectiveLabel, objectivesData, t }) {
    this.combatDebug = combatDebug;
    this.creatureName = creatureName;
    this.getCombat = getCombat;
    this.objectiveLabel = objectiveLabel;
    this.objectivesData = objectivesData;
    this.t = t;
    this.addLog = null;
  }

  setLogger(addLog) {
    this.addLog = addLog;
  }

  complete(id) {
    const combat = this.getCombat();
    if (!combat || combat.objectives[id]) return;
    const objective = this.objectivesData.find((item) => item.id === id);
    if (!objective) return;
    const completedBefore = Object.values(combat.objectives).filter(Boolean).length;
    combat.objectives[id] = true;
    applyCaptureProgress(combat, objective.reward);
    this.combatDebug("objective_complete", { id, reward: objective.reward });
    this.addLog?.(this.t("objective.complete", {
      objective: this.objectiveLabel(objective),
      reward: objective.reward
    }));
    if (
      completedBefore === 0
      && combat.huntAffix?.trigger === "objectif_capture_complete"
      && !combat.affixUses.chasseArdenteNotice
    ) {
      combat.affixUses.chasseArdenteNotice = 1;
      this.addLog?.(this.t("log.affix_burning_hunt_ready", { creature: this.creatureName() }));
    }
  }

  completeByType(type, predicate = () => true) {
    this.objectivesData
      .filter((objective) => objective.type === type && predicate(objective))
      .forEach((objective) => this.complete(objective.id));
  }

  registerHeroActionUse(actionId) {
    const combat = this.getCombat();
    combat.actionUses[actionId] = (combat.actionUses[actionId] ?? 0) + 1;
    this.completeByType("useAction", (objective) => (
      objective.actionId === actionId && combat.actionUses[actionId] >= objective.count
    ));
  }

  checkEnemyHpThreshold() {
    const combat = this.getCombat();
    if (combat.enemy.hp <= 0) return;
    this.completeByType("enemyHpThreshold", (objective) => (
      combat.enemy.hp / combat.enemy.maxHp <= objective.threshold
    ));
  }

  checkSurviveTurn() {
    const combat = this.getCombat();
    this.completeByType("surviveTurns", (objective) => combat.turn > objective.turns);
  }

  checkCaptureTiming() {
    const combat = this.getCombat();
    this.completeByType("captureBeforeTurn", (objective) => combat.turn <= objective.turn);
    if (combat.hero.pa >= 1) this.complete("sparePa");
    if (combat.hero.pa === 1) this.completeByType("captureWithOnePa");
    if (!combat.enemySpecialUsed) this.completeByType("preventSpecial");
  }

  checkFastHuntEndTiming() {
    const combat = this.getCombat();
    this.completeByType("surviveTurns", (objective) => combat.turn <= objective.turns);
    this.completeByType("captureBeforeTurn", (objective) => combat.turn <= objective.turn);
  }
}
