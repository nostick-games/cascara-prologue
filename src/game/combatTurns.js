import {
  absorbGuard,
  applyHitPoints,
  calculateEnemyDamageBreakdown,
  calculateEnemyGuard,
  rollChance
} from "./combatFormulas.js";
import { updateEnemyPlan } from "./combatState.js";
import {
  getEnemyAiConfig,
  selectAffordableEnemyAction,
  selectEnemyFollowUpAction,
  shouldEnemyHoldAfterLightAction
} from "./enemyAi.js";
import { applyTypeAdvantageDamage } from "./typeAdvantages.js";

const vagueMarkedAttackLogKeys = [
  "log.marked_attack_vague_secret",
  "log.marked_attack_vague_hidden",
  "log.marked_attack_vague_unreadable"
];

export class CombatTurns {
  constructor(controller) {
    this.controller = controller;
  }

  endPlayerTurn() {
    const ctx = this.controller;
    const combat = ctx.combat;
    if (!combat || combat.ended) return;
    if (combat.hero.pa >= 1) {
      ctx.objectives.complete("sparePa");
      ctx.affixes.prepareConcentration();
    }
    ctx.lockPlayerInput();
    combat.phase = "enemy";
    ctx.combatDebug("player_turn_end");
    ctx.renderCombatUi();
    ctx.affixes.trySouffleRelatif("enemy");
    setTimeout(() => this.enemyTurn(), 420);
  }

  updateCreaturePlan() {
    const ctx = this.controller;
    const combat = ctx.combat;
    const plan = updateEnemyPlan(combat);
    const action = combat.enemy.currentAction;
    ctx.combatDebug("enemy_plan", { plan, actionId: action?.id });
    if (action?.marked) {
      if (combat.hero.perception > combat.enemy.perception) {
        ctx.addLog(ctx.t("log.marked_attack", ctx.humanOpponentVars({
          creature: ctx.creatureName(),
          action: ctx.t(action.nameKey)
        })));
        return;
      }

      const vagueKey = vagueMarkedAttackLogKeys[Math.floor(Math.random() * vagueMarkedAttackLogKeys.length)];
      ctx.addLog(ctx.t(vagueKey, ctx.humanOpponentVars({ creature: ctx.creatureName() })));
    }
  }

  enemyTurn({ isFollowUp = false, skipStatus = false } = {}) {
    const ctx = this.controller;
    const combat = ctx.combat;
    if (!combat || combat.ended) return;
    if (!isFollowUp) combat.enemyLastAction = null;
    const enemy = combat.enemy;
    const hero = combat.hero;
    if (!isFollowUp && enemy.signature?.pending) {
      enemy.signature.pending = null;
      const result = ctx.resolveSignatureEffect("enemy");
      if (!combat.ended && result === "queued") {
        setTimeout(() => {
          if (!ctx.combat || ctx.combat.ended || ctx.combat.phase !== "enemy") return;
          this.scheduleAdvanceEnemyTurn();
        }, 1240);
      } else if (!combat.ended) {
        this.scheduleAdvanceEnemyTurn();
      }
      return;
    }
    if (!isFollowUp && !skipStatus && ctx.tickEnemyStatuses()) return;
    const paralysis = enemy.statuses?.paralysie;
    if (!isFollowUp && paralysis && rollChance(paralysis.blockChance)) {
      ctx.addLog(ctx.t("log.enemy_status_paralysis_blocks", { creature: ctx.creatureName() }));
      this.scheduleAdvanceEnemyTurn();
      return;
    }
    const action = selectAffordableEnemyAction(enemy);
    if (!action) {
      ctx.combatDebug("enemy_no_affordable_action", { remainingPa: enemy.pa });
      ctx.addLog(ctx.t("log.enemy_no_pa", { creature: ctx.creatureName() }));
      this.scheduleAdvanceEnemyTurn();
      return;
    }
    enemy.currentAction = action;
    enemy.turnPlan = action.id;
    enemy.charging = action?.charging ?? false;
    enemy.markedAttack = action?.marked ?? false;
    if (action?.marked) combat.enemySpecialUsed = true;
    const actionNameText = action ? ctx.t(action.nameKey) : ctx.patternLabel(enemy.turnPlan);
    ctx.combatDebug("enemy_action_start", { actionId: action?.id });
    const actionCost = action?.cost ?? 0;
    ctx.combatScreen.capturePaState(combat, "enemy");
    enemy.pa = Math.max(0, enemy.pa - actionCost);
    ctx.renderCombatUi();

    if (action?.kind === "protection") {
      const guard = calculateEnemyGuard({ enemy, action });
      enemy.guard += guard;
      ctx.combatDebug("enemy_guard", { actionId: action?.id, guard });
      ctx.addLog(ctx.t("log.enemy_protection", {
        creature: ctx.creatureName(),
        action: actionNameText,
        guard
      }));
      ctx.affixes.applyGuard("enemy");
      if (actionCost >= 3) ctx.affixes.tryRetourDeGeste(action.id, "enemy");
      this.scheduleEnemyContinuation(action, { actionId: action.id, executed: true, guardGained: guard });
      return;
    }

    const hitChance = ctx.enemyHitChance();
    if (!rollChance(hitChance / 100)) {
      ctx.combatDebug("enemy_miss", { actionId: action?.id, hitChance: Math.round(hitChance) });
      ctx.addLog(ctx.t("log.enemy_miss", {
        creature: ctx.creatureName(),
        action: actionNameText,
        chance: Math.round(hitChance)
      }));
      if (combat.enemyLastAction !== "hit") combat.enemyLastAction = "missed";
      ctx.affixes.prepareRafale();
      if (actionCost >= 3) ctx.affixes.tryRetourDeGeste(action.id, "enemy");
      this.scheduleEnemyContinuation(action, { actionId: action.id, executed: true, hit: false, damage: 0 });
      return;
    }

    const enemyCrit = ctx.enemyRollCrit(action?.id, action?.critChance);
    ctx.affixes.consumeRafale(action?.id, "enemy");
    const damageBreakdown = calculateEnemyDamageBreakdown({ enemy, hero, action, critical: enemyCrit });
    let damage = damageBreakdown.damage;
    const calculatedDamage = damage;
    damage += ctx.affixes.applyMorsureSure(action?.id, "enemy");
    damage = ctx.affixes.applyConcentration(action?.id, damage, "enemy");
    const typeAdvantage = applyTypeAdvantageDamage(damage, enemy.type, hero.type);
    damage = typeAdvantage.damage;
    const enemyActionLogParams = {
      creature: ctx.creatureName(),
      action: actionNameText,
      critical: enemyCrit ? ctx.t("log.enemy_critical_suffix") : ""
    };
    if (!hero.feintReduction) {
      const enemyActionConnector = ctx.consumeEnemyActionLogContext();
      const hpRatio = enemy.hp / enemy.maxHp;
      let enemyActionMsg;
      if (hpRatio < 0.20) {
        enemyActionMsg = ctx.randomLog("log.enemy_action.critical", enemyActionLogParams, 1);
      } else if (hpRatio < 0.40) {
        enemyActionMsg = ctx.randomLog("log.enemy_action.low", enemyActionLogParams, 1);
      } else {
        enemyActionMsg = ctx.t("log.enemy_action", enemyActionLogParams);
      }
      ctx.addLog(enemyActionConnector ? enemyActionConnector + ctx.lowercaseFirst(enemyActionMsg) : enemyActionMsg);
    }
    if (typeAdvantage.advantaged) {
      ctx.addLog(ctx.t("log.type_advantage_enemy", {
        creature: ctx.creatureName(),
        attackerType: ctx.t(`affix.type.${enemy.type}`),
        defenderType: ctx.t(`affix.type.${hero.type}`)
      }));
    } else if (typeAdvantage.disadvantaged) {
      ctx.addLog(ctx.t("log.type_resist_enemy", {
        creature: ctx.creatureName(),
        attackerType: ctx.t(`affix.type.${enemy.type}`),
        defenderType: ctx.t(`affix.type.${hero.type}`)
      }));
    }
    ctx.affixes.applyCritical(enemyCrit, "enemy");

    if (hero.feintReduction) {
      // Parer un coup critique = feinter une attaque ennemie qui était critique.
      if (enemyCrit) ctx.objectives.completeByType("parryCritical");
      const originalDamage = damage;
      damage = Math.max(1, Math.round(damage * hero.feintReduction.multiplier));
      ctx.combatDebug("feint_reduction_applied", {
        actionId: action?.id,
        originalDamage,
        reducedDamage: damage,
        multiplier: hero.feintReduction.multiplier
      });
      ctx.addLog(ctx.t("log.feinte_reduce_attack", {
        ...enemyActionLogParams,
        action: actionNameText,
        reduced: damage,
        original: originalDamage
      }));
      hero.feintReduction = null;
    }

    const strikePower = damage + damageBreakdown.defenseReduction;
    let guardBlocked = 0;
    if (hero.guard > 0) {
      const guardResult = absorbGuard(hero, damage);
      damage = guardResult.damage;
      const { blocked } = guardResult;
      guardBlocked = blocked;
      if (blocked > 0) {
        combat.guardBlockedTotal = (combat.guardBlockedTotal ?? 0) + blocked;
        ctx.objectives.checkGuardBlocked();
      }
      if (action?.id === "burningHorns" && hero.guarding) {
        hero.parriedBurningHorns = true;
        ctx.addLog(ctx.t("log.parried_burning_horns"));
      }
    }

    if (damage > 0) {
      const heroHpBeforeActual = hero.hp;
      const heroHpBefore = combat.displayHp?.hero ?? hero.hp;
      applyHitPoints(hero, damage);
      ctx.combatDebug("enemy_damage", {
        actionId: action?.id,
        critical: enemyCrit,
        calculatedDamage,
        finalDamage: damage,
        heroHpAfter: hero.hp
      });
      combat.displayHp.hero = heroHpBefore;
      ctx.queueDamageFeedback({
        targetKey: "hero",
        message: ctx.damageLogMessage({
          label: ctx.damageActionLabel(actionNameText, enemyCrit),
          power: strikePower,
          damage,
          defenseReduced: damageBreakdown.defenseReduction > 0,
          guardBlocked
        }),
        flash: () => ctx.combatScreen.flashHero(),
        onSettled: hero.hp <= 0
          ? () => ctx.endCombat(false, ctx.t(ctx.context === "human" ? "log.human_defeat" : "log.defeat"))
          : () => {
            combat.enemyLastAction = "hit";
            ctx.applyCreatureArtStatus(action);
            ctx.affixes.applyEcaille();
            ctx.affixes.tryElanDeSurvie(heroHpBeforeActual);
            if (actionCost >= 3) ctx.affixes.tryRetourDeGeste(action.id, "enemy");
            this.scheduleEnemyContinuation(action, { actionId: action.id, executed: true, hit: true, damage });
          }
      });
      return;
    }

    ctx.addLog(ctx.damageLogMessage({
      label: ctx.damageActionLabel(actionNameText, enemyCrit),
      power: strikePower,
      damage,
      defenseReduced: damageBreakdown.defenseReduction > 0,
      guardBlocked
    }));
    combat.enemyLastAction = "hit";
    ctx.applyCreatureArtStatus(action);
    if (actionCost >= 3) ctx.affixes.tryRetourDeGeste(action.id, "enemy");
    this.scheduleEnemyContinuation(action, { actionId: action.id, executed: true, hit: true, damage });
  }

  scheduleAdvanceEnemyTurn() {
    const ctx = this.controller;
    const delay = getEnemyAiConfig(ctx.combat?.enemy ?? {}).actionDelayMs;
    setTimeout(() => {
      if (!ctx.combat || ctx.combat.ended || ctx.combat.phase !== "enemy") return;
      this.advanceEnemyTurn();
    }, delay);
  }

  scheduleEnemyContinuation(previousAction, signatureEvent = {}) {
    const ctx = this.controller;
    const delay = getEnemyAiConfig(ctx.combat?.enemy ?? {}).actionDelayMs;
    setTimeout(() => {
      const combat = ctx.combat;
      if (!combat || combat.ended || combat.phase !== "enemy") return;
      ctx.chargeSignatureForAction("enemy", previousAction.id, previousAction, signatureEvent);
      if (combat.enemy.signature?.pending) {
        this.advanceEnemyTurn();
        return;
      }
      const nextAction = selectEnemyFollowUpAction(combat.enemy);
      if (!nextAction) {
        if (combat.enemy.pa >= 1) ctx.affixes.prepareConcentration("enemy");
        if (combat.enemy.pa >= 1) {
          ctx.chargeSignatureForAction("enemy", "end", { id: "end" }, {
            actionId: "end",
            executed: true,
            savedPa: combat.enemy.pa
          });
        }
        this.advanceEnemyTurn();
        return;
      }

      if (shouldEnemyHoldAfterLightAction({ enemy: combat.enemy, previousAction })) {
        ctx.combatDebug("enemy_holds_after_light_action", {
          previousActionId: previousAction.id,
          remainingPa: combat.enemy.pa,
          chance: getEnemyAiConfig(combat.enemy).singleLightActionChance
        });
        ctx.addLog(ctx.t("log.enemy_holds_pa", { creature: ctx.creatureName() }));
        if (combat.enemy.pa >= 1) ctx.affixes.prepareConcentration("enemy");
        if (combat.enemy.pa >= 1) {
          ctx.chargeSignatureForAction("enemy", "end", { id: "end" }, {
            actionId: "end",
            executed: true,
            savedPa: combat.enemy.pa
          });
        }
        this.advanceEnemyTurn();
        return;
      }

      combat.enemy.currentAction = nextAction;
      combat.enemy.turnPlan = nextAction.id;
      combat.enemy.charging = nextAction.charging ?? false;
      combat.enemy.markedAttack = nextAction.marked ?? false;
      ctx.combatDebug("enemy_follow_up", { actionId: nextAction.id, remainingPa: combat.enemy.pa });
      this.enemyTurn({ isFollowUp: true });
    }, delay);
  }

  advanceEnemyTurn() {
    const ctx = this.controller;
    const combat = ctx.combat;
    const hero = combat.hero;
    const enemy = combat.enemy;
    combat.turn += 1;
    ctx.objectives.checkSurviveTurn();
    hero.maxPa = combat.build.pa;
    combat.paDenied.hero = Math.min(hero.nextPaPenalty, hero.maxPa);
    combat.paDenied.enemy = 0;
    hero.pa = Math.max(0, hero.maxPa - hero.nextPaPenalty);
    hero.temporaryPa = 0;
    enemy.pa = enemy.maxPa;
    hero.nextPaPenalty = 0;
    hero.guarding = false;
    hero.guard = ctx.decayHeroGuard(hero.guard);
    combat.phase = "player";
    combat.playerInputLocked = true;
    this.updateCreaturePlan();
    const heroStatusQueued = ctx.tickHeroStatuses();
    if (!heroStatusQueued) ctx.affixes.trySouffleRelatif();
    ctx.combatDebug("enemy_turn_end");
    ctx.renderCombatUi();
    ctx.combatScreen.syncCombat(combat);
    if (!heroStatusQueued) ctx.unlockPlayerInputWhenReady();
    ctx.onAfterEnemyTurn?.(combat.turn);
  }
}
