import { huntAffixLevel } from "./affixEffects.js";
import { affixes } from "../data/affixes.js";
import { baseHero } from "../data/hero/index.js";
import {
  applyHumanBuildTypeToAction,
  humanBuildTypeProfile
} from "../data/humanEnemies/humanBuildTypes.js";
import { CombatAffixes } from "./combatAffixes.js";
import { CombatDebug } from "./combatDebug.js";
import {
  absorbGuard,
  applyHitPoints,
  calculateCaptureChance,
  calculateCaptureProgressFromDamage,
  calculateFailedCaptureProgress,
  calculateHeroDamageBreakdown,
  calculateHeroGuard,
  calculateHitChance,
  combatFormulaConfig,
  rollChance
} from "./combatFormulas.js";
import {
  applyCaptureProgress,
  createCombatState,
  createEnemyState,
  createHeroFromBuild,
  spendActionPoints
} from "./combatState.js";
import {
  chargeHumanSignature,
  createHumanSignatureFromEquippedCreatures,
  isHumanSignatureReady,
  signatureChargeAmountForEvent,
  signatureChargePercent,
  updateTriadeElementFromAction
} from "./humanSignatures.js";
import {
  signatureComponents as getSignatureComponents,
  signatureEffectCanBeMitigated as canMitigateSignatureEffect,
  signatureEffectKind as getSignatureEffectKind,
  signatureElementName as getSignatureElementName,
  signatureLogKey as getSignatureLogKey,
  signatureLogParams as getSignatureLogParams,
  signatureName as getSignatureName
} from "./combatSignatureEffects.js";
import { resolveSignatureEffect as resolveHumanSignatureEffect } from "./combatSignatureResolution.js";
import {
  applyCombatItemToState,
  isCombatItemEffective,
  listCombatInventoryItems
} from "./combatItems.js";
import { CombatLog } from "./combatLog.js";
import { CombatObjectives } from "./combatObjectives.js";
import { grantCapturedCreatureReward, grantCombatCurrencyReward, grantEncounterAffixReward } from "./combatRewards.js";
import { CombatTurns } from "./combatTurns.js";
import { recordEquippedCreatureVictory } from "./creatureProgression.js";
import { creatures } from "../data/creatures.js";
import {
  typeStatusChance,
  typeStatusForCreature,
  typeStatusIntensity
} from "./typeStatuses.js";
import { applyTypeAdvantageDamage } from "./typeAdvantages.js";
import { nativeHaptic } from "../utils/nativeBridge.js";

const damageFlashMs = 1120;
const enemyInitiativeGuardBonus = 3;
// Multiplicateur de chance d'infliger le statut de type selon le genre d'action.
// L'Art reste la source principale, mais les attaques fortes en posent aussi (moins
// souvent) pour que les statuts — et donc leurs remèdes — servent régulièrement.
// Monter `simple` au-dessus de 0 rendrait les statuts encore plus fréquents.
const enemyStatusChanceByActionKind = {
  art: 1,
  strong: 0.6,
  simple: 0
};

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clampHeroHp(value, maxHp) {
  return Math.max(1, Math.min(maxHp, value));
}

export class CombatController {
  constructor({
    actionDefinitions,
    baseProgression,
    build,
    combatScreen,
    context = "capture",
    creature,
    encounter,
    encounterAffix,
    getActiveHuntAffix,
    getActiveHumanAffix = () => null,
    heroName = "Hero",
    getUnspentXp = () => 0,
    inventoryModalShield,
    logNode,
    onCombatReadyToContinue = () => {},
    objectivesData,
    setOwnedHuntAffixes,
    t
  }) {
    this.actionDefinitions = actionDefinitions;
    this.baseActionDefinitions = actionDefinitions;
    this.baseProgression = baseProgression;
    this.build = build;
    this.combatScreen = combatScreen;
    this.context = context;
    this.creature = creature;
    this.encounter = encounter;
    this.encounterAffix = encounterAffix;
    this.getActiveHuntAffix = getActiveHuntAffix;
    this.getActiveHumanAffix = getActiveHumanAffix;
    this.heroName = heroName;
    this.getUnspentXp = getUnspentXp;
    this.inventoryModal = null;
    this.inventoryModalShield = inventoryModalShield;
    this.logNode = logNode;
    this.onCombatReadyToContinue = onCombatReadyToContinue;
    this.objectivesData = objectivesData;
    this.setOwnedHuntAffixes = setOwnedHuntAffixes;
    this.t = t;
    this.buildOverride = null;

    this.combat = null;
    this.lastCombatResult = null;
    this.debug = new CombatDebug({ getCombat: () => this.combat });
    this.log = new CombatLog({ node: logNode });
    this.turns = new CombatTurns(this);
    this.affixes = new CombatAffixes({
      addLog: (message, afterTyped) => this.addLog(message, afterTyped),
      combatDebug: (event, details) => this.combatDebug(event, details),
      creatureName: () => this.creatureName(),
      getCombat: () => this.combat,
      renderCombatUi: () => this.renderCombatUi(),
      syncCombat: (combat) => this.combatScreen.syncCombat(combat),
      t
    });
    this.objectives = new CombatObjectives({
      combatDebug: (event, details) => this.combatDebug(event, details),
      creatureName: () => this.creatureName(),
      getCombat: () => this.combat,
      objectiveLabel: (objective) => this.objectiveLabel(objective),
      objectivesData,
      t
    });
    this.objectives.setLogger((message, afterTyped) => this.addLog(message, afterTyped));
  }

  configureEncounter({ context = "capture", creature, encounter, encounterAffix, objectivesData, buildOverride = null }) {
    this.context = context;
    this.creature = creature;
    this.encounter = encounter;
    this.encounterAffix = encounterAffix;
    this.objectivesData = objectivesData;
    this.objectives.objectivesData = objectivesData;
    this.buildOverride = buildOverride;
    this.combat = null;
    this.lastCombatResult = null;
  }

  setInventoryModal(inventoryModal) {
    this.inventoryModal = inventoryModal;
  }

  getCombat() {
    return this.combat;
  }

  hasCombat() {
    return Boolean(this.combat);
  }

  creatureName() {
    return this.t(this.creature.nameKey);
  }

  statusName(statusId) {
    return this.t(`status.${statusId}.name`);
  }

  huntAffixName(affix) {
    return this.t(affix.nameKey);
  }

  enemyAffix() {
    if (this.context !== "human" || !this.creature.activeAffixId) return null;
    return affixes.find((affix) => affix.id === this.creature.activeAffixId) ?? null;
  }

  objectiveLabel(objective) {
    return this.t(objective.labelKey);
  }

  actionName(actionId) {
    return this.t(this.actionDefinitions[actionId].nameKey);
  }

  actionDefinitionsForBuild(build) {
    const buildTypeProfile = humanBuildTypeProfile(build.type, build.typeRank);
    if (!buildTypeProfile) return this.baseActionDefinitions;

    return Object.fromEntries(Object.entries(this.baseActionDefinitions).map(([actionId, action]) => [
      actionId,
      applyHumanBuildTypeToAction(action, buildTypeProfile)
    ]));
  }

  patternLabel(patternId) {
    return this.t(this.creature.combat.actions[patternId]?.patternKey ?? `combat.pattern.${patternId}`);
  }

  combatInventoryItems() {
    return listCombatInventoryItems({
      inventory: this.baseProgression.inventory,
      t: this.t
    });
  }

  isCombatItemEffective(item) {
    return isCombatItemEffective({ combat: this.combat, item });
  }

  async applyCombatItem(entry) {
    const combat = this.combat;
    if (!combat || combat.ended) return;
    const isHealingItem = entry.item.effect === "halfHeal" || entry.item.effect === "fullHeal";
    const startHp = combat.hero.hp;
    this.combatScreen.capturePaState(combat, "player");
    applyCombatItemToState({
      combat,
      entry,
      inventory: this.baseProgression.inventory,
      t: this.t,
      addLog: (message) => this.addLog(message)
    });
    const targetHp = combat.hero.hp;

    if (isHealingItem && targetHp > startHp) {
      combat.hero.hp = startHp;
      combat.displayHp.hero = startHp;
      this.inventoryModal?.renderItems();
      for (let hp = startHp + 1; hp <= targetHp; hp += 1) {
        combat.hero.hp = hp;
        combat.displayHp.hero = hp;
        this.inventoryModal?.renderHeader();
        this.renderCombatUi();
        this.combatScreen.syncCombat(combat);
        nativeHaptic("light");
        await wait(220);
      }
      return { waitForClose: true };
    }

    this.renderCombatUi();
    this.combatScreen.syncCombat(combat);
    return null;
  }

  addLog(message, afterTyped = null) {
    this.log.add(message, afterTyped);
  }

  addContinueIndicator(afterTyped = null) {
    this.log.addContinueIndicator(afterTyped);
  }

  addRewardLog(message, reward, afterTyped = null) {
    this.log.addReward(message, reward, afterTyped);
  }

  clearLog() {
    this.log.clear();
  }

  combatDebug(event, details = {}) {
    this.debug.log(event, details);
  }

  logCombatStatsSummary() {
    const combat = this.combat;
    if (!combat) return;

    const percent = (value) => `${Math.round((value ?? 0) * 100)}%`;
    const statRow = (label, actor, extra = {}) => ({
      camp: label,
      nom: actor.name ?? this.heroName,
      type: actor.type ?? "-",
      niv: actor.level ?? "-",
      pv: `${actor.hp}/${actor.maxHp}`,
      pa: actor.maxPa,
      puissance: actor.power,
      defense: actor.defense,
      vitesse: actor.speed,
      perception: actor.perception,
      critique: percent(actor.critChance),
      stabilite: actor.stability ?? "-",
      scaling: actor.scaling ?? "-",
      ...extra
    });

    const opponentLabel = this.context === "human" ? "Humain" : "Fawna";
    console.groupCollapsed(`[Stats combat] ${this.heroName} vs ${this.creatureName()} (${opponentLabel})`);
    console.table([
      statRow("Joueur", combat.hero, {
        instinct: combat.playerAffix?.id ?? "-"
      }),
      statRow(opponentLabel, combat.enemy, {
        instinct: combat.enemyAffix?.id ?? "-",
        plan: combat.enemy.turnPlan ?? "-"
      })
    ]);
    console.info("[Stats combat] Contexte", {
      context: this.context,
      encounterScaling: this.encounter?.scaling ?? 0,
      capture: combat.capture,
      playerXp: this.baseProgression.availableXp
    });
    console.groupEnd();
  }

  startCombat() {
    const activeBuild = this.buildOverride ?? this.build;
    this.actionDefinitions = this.actionDefinitionsForBuild(activeBuild);
    const hero = createHeroFromBuild(activeBuild);
    this.syncHeroPersistentHp(hero);
    const enemy = createEnemyState({
      name: this.creatureName(),
      type: this.creature.type,
      combatProfile: this.creature.combat,
      scaling: this.encounter?.scaling ?? 0,
      scalingConfig: {
        ...combatFormulaConfig,
        baseHeroPower: baseHero.stats.power,
        heroPower: activeBuild.power
      }
    });
    this.combat = createCombatState({ hero, enemy, build: activeBuild, objectives: this.objectivesData });
    const combat = this.combat;
    if (this.context === "human") {
      combat.hero.signature = createHumanSignatureFromEquippedCreatures(activeBuild.equippedCreatures);
      combat.enemy.signature = createHumanSignatureFromEquippedCreatures(this.creature.combat?.inheritedStats?.sources);
    }
    combat.displayHp = {
      hero: hero.hp,
      enemy: enemy.hp
    };
    combat.damageAnimating = false;
    combat.playerAffix = this.context === "human" ? this.getActiveHumanAffix() : this.getActiveHuntAffix();
    combat.huntAffix = combat.playerAffix;
    combat.enemyAffix = this.enemyAffix();
    combat.affixUses = {};
    combat.affixTurnUses = {};
    combat.affixRewardGranted = false;
    combat.actionUses = {};
    combat.enemySpecialUsed = false;
    combat.paDenied = { hero: 0, enemy: 0 };
    this.combatScreen.resetPaState();
    this.debug.reset();
    this.combatDebug("combat_start", {
      playerXp: this.baseProgression.availableXp,
      encounterScaling: this.encounter.scaling,
      build: { ...activeBuild },
      playerAffixId: combat.playerAffix?.id ?? null,
      enemyAffixId: combat.enemyAffix?.id ?? null
    });
    this.logCombatStatsSummary();

    if (enemy.speed > hero.speed) {
      hero.guard += enemyInitiativeGuardBonus;
      this.addLog(this.t("log.enemy_initiative", {
        opponent: this.creatureName(),
        creature: this.creatureName(),
        guard: enemyInitiativeGuardBonus
      }));
      this.chargeSignatureForAction("enemy", "initiative", { id: "initiative" }, { actionId: "initiative", actedFirst: true });
      combat.phase = "enemy";
    } else if (hero.speed > enemy.speed) {
      this.addLog(this.t("log.initiative"));
      this.chargeSignatureForAction("hero", "initiative", { id: "initiative" }, { actionId: "initiative", actedFirst: true });
    } else {
      this.addLog(this.t("log.capture_start", { creature: this.creatureName() }));
    }

    if (this.context === "capture") this.revealPerception();
    this.turns.updateCreaturePlan();
    if (combat.phase === "player") {
      this.affixes.trySouffleRelatif();
    }
    this.combatScreen.syncCombat(combat);
    this.renderCombatUi();
    this.combatScreen.playEnemyEntrance();
    if (combat.phase === "enemy") setTimeout(() => this.turns.enemyTurn(), 420);
  }

  syncHeroPersistentHp(hero) {
    const previousMaxHp = this.baseProgression.heroMaxHp ?? hero.maxHp;
    const previousHp = this.baseProgression.heroHp;
    if (Number.isFinite(previousHp)) {
      const maxHpDelta = hero.maxHp - previousMaxHp;
      hero.hp = clampHeroHp(previousHp + Math.max(0, maxHpDelta), hero.maxHp);
    }
    this.baseProgression.heroMaxHp = hero.maxHp;
    this.baseProgression.heroHp = hero.hp;
  }

  respawnHpForMax(maxHp) {
    return Math.max(1, Math.ceil(maxHp * 0.5));
  }

  persistHeroHp({ respawn = false, restoreFull = false } = {}) {
    const hero = this.combat?.hero;
    if (!hero) return;
    this.baseProgression.heroMaxHp = hero.maxHp;
    if (restoreFull) {
      this.baseProgression.heroHp = hero.maxHp;
      return;
    }
    this.baseProgression.heroHp = respawn
      ? this.respawnHpForMax(hero.maxHp)
      : clampHeroHp(hero.hp, hero.maxHp);
  }

  restoreHeroHpForRespawn() {
    const hero = this.combat?.hero;
    const maxHp = hero?.maxHp ?? this.baseProgression.heroMaxHp;
    if (!Number.isFinite(maxHp)) return;
    const respawnHp = this.respawnHpForMax(maxHp);
    this.baseProgression.heroMaxHp = maxHp;
    this.baseProgression.heroHp = respawnHp;
    if (hero) {
      hero.hp = respawnHp;
      if (this.combat?.displayHp) this.combat.displayHp.hero = respawnHp;
    }
  }

  revealPerception() {
    if (this.build.perception >= 4) {
      this.addLog(this.t("log.perception_reveals"));
    } else {
      this.addLog(this.t("log.perception_low"));
    }
  }

  rollCrit(actionId, actionCritChance = 0) {
    const bonus = actionId === "entaille" ? (this.combat.hero.nextEntailleCritBonus ?? 0) : 0;
    return rollChance(this.combat.hero.critChance + (actionCritChance ?? 0) + bonus / 100);
  }

  enemyRollCrit(actionId, actionCritChance = null) {
    const bonus = actionId === "entaille" ? (this.combat.enemy.nextEntailleCritBonus ?? 0) : 0;
    return rollChance((actionCritChance ?? this.combat.enemy.critChance) + bonus / 100);
  }

  spendPa(cost) {
    const hero = this.combat.hero;
    const before = hero.pa;
    const temporaryBefore = hero.temporaryPa ?? 0;
    const spent = spendActionPoints(hero, cost);
    if (spent && hero.temporaryPa > 0) {
      const consumedTemporaryPa = Math.min(temporaryBefore, Math.max(0, before - hero.pa));
      hero.temporaryPa = Math.max(0, temporaryBefore - consumedTemporaryPa);
      hero.temporaryPaSpentFlash = consumedTemporaryPa;
    }
    return spent;
  }

  heroHitChance() {
    return calculateHitChance({
      attackerSpeed: this.combat.hero.speed,
      targetSpeed: this.combat.enemy.speed
    });
  }

  enemyHitChance() {
    return calculateHitChance({
      attackerSpeed: this.combat.enemy.speed,
      targetSpeed: this.combat.hero.speed
    });
  }

  syncDisplayedHitPoints(targetKey) {
    const combat = this.combat;
    if (!combat?.displayHp) return;
    combat.displayHp[targetKey] = combat[targetKey].hp;
    this.renderCombatUi();
    this.combatScreen.syncCombat(combat);
  }

  queueDamageFeedback({ targetKey, message, flash, onSettled = null }) {
    const combat = this.combat;
    const target = combat[targetKey];
    const previousHp = combat.displayHp?.[targetKey] ?? target.hp;
    if (!combat.displayHp) combat.displayHp = {};
    combat.displayHp[targetKey] = previousHp;
    combat.damageAnimating = true;

    this.addLog(message, () => {
      flash?.();
      window.setTimeout(() => {
        if (!this.combat) return;
        this.combat.damageAnimating = false;
        this.syncDisplayedHitPoints(targetKey);
        onSettled?.();
      }, damageFlashMs);
    });
  }

  damageLogMessage({ label, power, damage, defenseReduced = false, guardBlocked = 0, targetName = null }) {
    const hasGuard = guardBlocked > 0;
    if (targetName && defenseReduced && hasGuard) {
      return this.t("log.damage_defense_guard", { label, power, target: targetName, damage });
    }
    if (targetName && defenseReduced) {
      return this.t("log.damage_defense", { label, power, target: targetName, damage });
    }
    if (targetName && hasGuard) {
      return this.t("log.damage_guard", { label, power, target: targetName, damage });
    }
    if (!targetName && defenseReduced && hasGuard) {
      return this.t("log.enemy_damage_defense_guard", { label, power, damage });
    }
    if (!targetName && defenseReduced) {
      return this.t("log.enemy_damage_defense", { label, power, damage });
    }
    if (!targetName && hasGuard) {
      return this.t("log.enemy_damage_guard", { label, power, damage });
    }
    return this.t("log.damage_power", { label, power });
  }

  damageActionLabel(label, critical = false) {
    return critical ? this.t("log.damage_critical_label", { label }) : label;
  }

  damageEnemy(action) {
    const combat = this.combat;
    const hitChance = this.heroHitChance();
    if (!rollChance(hitChance / 100)) {
      this.combatDebug("hero_miss", { action: action.id, hitChance: Math.round(hitChance) });
      this.addLog(this.t("log.miss", { label: this.actionName(action.id), chance: Math.round(hitChance) }));
      this.affixes.prepareRafale("enemy");
      return { hit: false, damage: 0 };
    }

    const crit = this.rollCrit(action.id, action.critChance ?? 0);
    this.affixes.consumeRafale(action.id);
    const damageBreakdown = calculateHeroDamageBreakdown({
      hero: combat.hero,
      enemy: combat.enemy,
      baseDamage: action.baseDamage,
      powerScale: action.powerScale ?? 1,
      critical: crit
    });
    let damage = damageBreakdown.damage;
    damage += this.affixes.applyMorsureSure(action.id);
    damage = this.affixes.applyConcentration(action.id, damage);
    const typeAdvantage = applyTypeAdvantageDamage(damage, combat.hero.type, combat.enemy.type);
    damage = typeAdvantage.damage;
    if (typeAdvantage.advantaged) {
      this.addLog(this.t("log.type_advantage_player", {
        attackerType: this.t(`affix.type.${combat.hero.type}`),
        defenderType: this.t(`affix.type.${combat.enemy.type}`)
      }));
    } else if (typeAdvantage.disadvantaged) {
      this.addLog(this.t("log.type_resist_player", {
        attackerType: this.t(`affix.type.${combat.hero.type}`),
        defenderType: this.t(`affix.type.${combat.enemy.type}`)
      }));
    }
    if (crit) this.objectives.completeByType("criticalBeforeCapture");
    if (crit && combat.hero.parriedBurningHorns) {
      this.objectives.complete("parry");
      combat.hero.parriedBurningHorns = false;
    }
    this.affixes.applyCritical(crit);
    const strikePower = damage + damageBreakdown.defenseReduction;
    let guardBlocked = 0;
    if (combat.enemy.guard > 0) {
      const guardResult = absorbGuard(combat.enemy, damage);
      damage = guardResult.damage;
      guardBlocked = guardResult.blocked;
    }
    const enemyHpBefore = combat.displayHp?.enemy ?? combat.enemy.hp;
    const enemyHpBeforeActual = combat.enemy.hp;
    applyHitPoints(combat.enemy, damage);
    this.combatDebug("hero_damage", {
      action: action.id,
      critical: crit,
      damage,
      enemyHpAfter: combat.enemy.hp
    });
    applyCaptureProgress(combat, calculateCaptureProgressFromDamage({ damage, critical: crit }));
    this.objectives.checkEnemyHpThreshold();
    if (damage > 0) {
      combat.displayHp.enemy = enemyHpBefore;
      this.queueDamageFeedback({
        targetKey: "enemy",
        message: this.damageLogMessage({
          label: this.damageActionLabel(this.actionName(action.id), crit),
          power: strikePower,
          damage,
          defenseReduced: damageBreakdown.defenseReduction > 0,
          guardBlocked,
          targetName: this.creatureName()
        }),
        flash: () => this.combatScreen.flashEnemy(),
        onSettled: combat.enemy.hp <= 0
          ? () => this.endEnemyFlee()
          : () => {
            this.affixes.applyEcaille("enemy");
            this.affixes.tryElanDeSurvie(enemyHpBeforeActual, "enemy");
          }
      });
    } else {
      this.addLog(this.damageLogMessage({
        label: this.damageActionLabel(this.actionName(action.id), crit),
        power: strikePower,
        damage,
        defenseReduced: damageBreakdown.defenseReduction > 0,
        guardBlocked,
        targetName: this.creatureName()
      }));
    }
    if (crit && combat.enemy.charging) {
      this.interruptCharge(this.t("log.critical_interrupt", { creature: this.creatureName() }));
    }

    return { hit: true, damage };
  }

  tickEnemyStatuses() {
    const combat = this.combat;
    const exposed = combat.enemy.statuses?.a_decouvert;
    if (exposed) {
      const { lostGuard, ruptureDamage } = this.applyGuardRupture(combat.enemy, exposed.guardLoss);
      this.combatDebug("enemy_status_tick", {
        status: "a_decouvert",
        lostGuard,
        ruptureDamage
      });
      if (lostGuard > 0 || ruptureDamage > 0) {
        this.addLog(this.t("log.status_exposed_guard_loss", {
          creature: this.creatureName(),
          guard: lostGuard,
          damage: ruptureDamage
        }));
        if (ruptureDamage > 0) {
          this.syncDisplayedHitPoints("enemy");
          if (combat.enemy.hp <= 0) {
            this.endEnemyFlee();
            return true;
          }
        }
      }
    }

    const burn = combat.enemy.statuses?.brulure_legere;
    if (!burn) return false;

    const enemyHpBefore = combat.displayHp?.enemy ?? combat.enemy.hp;
    applyHitPoints(combat.enemy, burn.damage);
    this.combatDebug("enemy_status_tick", {
      status: "brulure_legere",
      damage: burn.damage,
      enemyHpAfter: combat.enemy.hp
    });
    combat.displayHp.enemy = enemyHpBefore;
    this.queueDamageFeedback({
      targetKey: "enemy",
      message: this.t("log.status_burn_damage", {
        creature: this.creatureName(),
        damage: burn.damage
      }),
      flash: () => this.combatScreen.flashEnemy(),
      onSettled: combat.enemy.hp <= 0
        ? () => this.endEnemyFlee()
        : () => this.turns.enemyTurn({ skipStatus: true })
    });

    return true;
  }

  endEnemyFlee() {
    if (this.context === "human") {
      this.endCombat(true, this.t("log.human_victory", { opponent: this.creatureName() }), "victory");
      return;
    }
    this.objectives.checkFastHuntEndTiming();
    this.endCombat(false, this.t("log.enemy_flees", { creature: this.creatureName() }), "flee");
  }

  tickHeroStatuses() {
    const combat = this.combat;
    const hero = combat.hero;
    const burn = hero.statuses?.brulure;
    if (burn) {
      const heroHpBeforeActual = hero.hp;
      const heroHpBefore = combat.displayHp?.hero ?? hero.hp;
      applyHitPoints(hero, burn.damage);
      combat.displayHp.hero = heroHpBefore;
      this.combatDebug("hero_status_tick", {
        status: "brulure",
        damage: burn.damage,
        heroHpAfter: hero.hp
      });
      this.queueDamageFeedback({
        targetKey: "hero",
        message: this.t("log.hero_status_burn_damage", { damage: burn.damage }),
        flash: () => this.combatScreen.flashHero(),
        onSettled: hero.hp <= 0
          ? () => this.endCombat(false, this.t(this.context === "human" ? "log.human_defeat" : "log.defeat"))
          : () => {
            this.affixes.tryElanDeSurvie(heroHpBeforeActual);
            this.affixes.trySouffleRelatif();
          }
      });
      return true;
    }

    const exposed = hero.statuses?.a_decouvert;
    if (exposed) {
      const { lostGuard, ruptureDamage } = this.applyGuardRupture(hero, exposed.guardLoss);
      this.combatDebug("hero_status_tick", { status: "a_decouvert", lostGuard, ruptureDamage });
      if (lostGuard > 0 || ruptureDamage > 0) {
        this.addLog(this.t("log.hero_status_exposed_guard_loss", { guard: lostGuard, damage: ruptureDamage }));
        if (ruptureDamage > 0) {
          this.syncDisplayedHitPoints("hero");
          if (hero.hp <= 0) {
            this.endCombat(false, this.t(this.context === "human" ? "log.human_defeat" : "log.defeat"));
            return true;
          }
        }
      }
    }

    const paralysis = hero.statuses?.paralysie;
    hero.blockedActionId = null;
    if (paralysis && rollChance(paralysis.blockChance)) {
      const candidates = ["entaille", "garde", "feinte", "art", "capture"]
        .filter((actionId) => hero.pa >= (this.actionDefinitions[actionId]?.cost ?? Number.POSITIVE_INFINITY));
      hero.blockedActionId = candidates[Math.floor(Math.random() * candidates.length)] ?? null;
      if (hero.blockedActionId) {
        this.addLog(this.t("log.hero_status_paralysis_blocks", {
          action: this.t(this.actionDefinitions[hero.blockedActionId].nameKey)
        }));
      }
    }

    return false;
  }

  applyCreatureArtStatus(action, { chanceMultiplier = 1, interrupted = false } = {}) {
    const combat = this.combat;
    const kindMultiplier = enemyStatusChanceByActionKind[action?.kind] ?? 0;
    if (kindMultiplier <= 0) return;
    const status = typeStatusForCreature(combat.enemy);
    const statusChance = Math.min(1, typeStatusChance(combat.enemy) * kindMultiplier * chanceMultiplier);
    if (!status || !rollChance(statusChance)) return;

    const intensity = typeStatusIntensity(combat.enemy);
    if (status.id === "brulure") {
      combat.hero.statuses.brulure = { damage: intensity };
      this.combatDebug("creature_art_status_applied", {
        status: status.id,
        damage: intensity,
        interrupted,
        statusChance
      });
      this.addLog(interrupted
        ? this.t("log.enemy_art_status_through_feint", {
          hero: this.heroName,
          creature: this.creatureName(),
          status: this.statusName(status.id)
        })
        : this.t("log.enemy_status_burn_applied", {
          creature: this.creatureName(),
          action: this.t(action.nameKey),
          damage: intensity
        }));
    }

    if (status.id === "paralysie") {
      combat.hero.statuses.paralysie = { blockChance: intensity };
      this.combatDebug("creature_art_status_applied", {
        status: status.id,
        blockChance: intensity,
        interrupted,
        statusChance
      });
      this.addLog(interrupted
        ? this.t("log.enemy_art_status_through_feint", {
          hero: this.heroName,
          creature: this.creatureName(),
          status: this.statusName(status.id)
        })
        : this.t("log.enemy_status_paralysis_applied", {
          creature: this.creatureName(),
          action: this.t(action.nameKey),
          chance: Math.round(intensity * 100)
        }));
    }

    if (status.id === "a_decouvert") {
      combat.hero.statuses.a_decouvert = { guardLoss: intensity };
      this.combatDebug("creature_art_status_applied", {
        status: status.id,
        guardLoss: intensity,
        interrupted,
        statusChance
      });
      this.addLog(interrupted
        ? this.t("log.enemy_art_status_through_feint", {
          hero: this.heroName,
          creature: this.creatureName(),
          status: this.statusName(status.id)
        })
        : this.t("log.enemy_status_exposed_applied", {
          creature: this.creatureName(),
          action: this.t(action.nameKey),
          guard: intensity
        }));
    }
  }

  interruptCharge(prefix) {
    const combat = this.combat;
    if (!combat.enemy.charging) return;
    combat.enemy.charging = false;
    combat.enemy.markedAttack = false;
    combat.enemy.turnPlan = "shaken_claw";
    const fallbackAction = Object.values(this.creature.combat.actions)[0];
    combat.enemy.currentAction = {
      id: "shakenClaw",
      nameKey: fallbackAction.nameKey,
      patternKey: "combat.pattern.shaken_claw",
      damage: 8,
      kind: "simple"
    };
    this.objectives.complete("interrupt");
    this.addLog(`${prefix}.`);
  }

  prepareFeintReduction() {
    const combat = this.combat;
    const action = combat.enemy.currentAction;
    if (!action || action.kind === "protection") return;
    combat.hero.feintReduction = {
      multiplier: 0.5,
      actionName: this.t(action.nameKey)
    };
    this.combatDebug("feint_reduction_prepared", {
      targetAction: action.id,
      multiplier: combat.hero.feintReduction.multiplier
    });
  }

  decayHeroGuard(guard) {
    if (guard <= 0) return 0;
    return Math.max(1, Math.round(guard * 0.45));
  }

  signatureName(signature) {
    return getSignatureName(this.t, signature);
  }

  signatureElementName(signature) {
    return getSignatureElementName(this.t, signature);
  }

  signatureLogKey(signature, kind) {
    return getSignatureLogKey(signature, kind);
  }

  signatureLogParams(signature, ownerName) {
    return getSignatureLogParams(this.t, signature, ownerName);
  }

  announceSignatureCharged(side) {
    const combat = this.combat;
    const actor = side === "enemy" ? combat.enemy : combat.hero;
    const signature = actor.signature;
    if (!signature || signature.readyAnnounced) return;
    const ownerName = side === "enemy" ? this.creatureName() : this.heroName;
    this.addLog(this.t(this.signatureLogKey(signature, "charged"), this.signatureLogParams(signature, ownerName)));
    signature.readyAnnounced = true;
  }

  announceSignatureReadyReminder() {
    const signature = this.combat?.hero.signature;
    if (!isHumanSignatureReady(signature)) return;
    this.addLog(this.t(this.signatureLogKey(signature, "ready"), this.signatureLogParams(signature, this.heroName)));
  }

  chargeSignatureForAction(side, actionId, action, event = {}) {
    const combat = this.combat;
    if (this.context !== "human" || !combat || combat.ended) return false;
    const actor = side === "enemy" ? combat.enemy : combat.hero;
    const signature = actor.signature;
    if (!signature) return false;
    updateTriadeElementFromAction(signature, action);
    const amount = signatureChargeAmountForEvent(signature, {
      ...event,
      actionId
    });
    if (amount <= 0) return false;
    const becameReady = chargeHumanSignature(signature, amount);
    this.combatDebug("signature_charge", {
      side,
      signatureId: signature.id,
      charge: signatureChargePercent(signature),
      amount
    });
    if (becameReady) {
      this.announceSignatureCharged(side);
      if (side === "enemy") this.prepareEnemySignature();
    } else if (side === "enemy" && [50, 75].some((threshold) => (
      signature.charge >= threshold && signature.charge - amount < threshold
    ))) {
      this.addLog(this.t("log.signature_enemy_progress", {
        signature: this.signatureName(signature),
        creature: this.creatureName(),
        charge: signatureChargePercent(signature)
      }));
    }
    return becameReady;
  }

  prepareEnemySignature() {
    const signature = this.combat?.enemy.signature;
    if (!isHumanSignatureReady(signature) || signature.pending) return;
    signature.pending = { turns: 1 };
    this.addLog(this.t("log.signature_enemy_prepare", {
      creature: this.creatureName(),
      signature: this.signatureName(signature),
      detail: signature.kind === "triade"
        ? this.t("log.signature_enemy_prepare_element", { element: this.signatureElementName(signature) })
        : ""
    }));
  }

  grantSignaturePa(target, amount) {
    const before = target.pa;
    target.pa = Math.min(target.maxPa, target.pa + amount);
    return target.pa - before;
  }

  denySignaturePa(targetKey, amount) {
    const combat = this.combat;
    if (targetKey === "hero") {
      const before = combat.hero.nextPaPenalty ?? 0;
      combat.hero.nextPaPenalty = Math.min(combat.hero.maxPa, before + amount);
      combat.paDenied.hero = Math.min(combat.hero.nextPaPenalty, combat.hero.maxPa);
      return combat.hero.nextPaPenalty - before;
    }

    const before = combat.enemy.pa;
    combat.enemy.pa = Math.max(0, combat.enemy.pa - amount);
    combat.paDenied.enemy = Math.max(combat.paDenied.enemy ?? 0, before - combat.enemy.pa);
    return before - combat.enemy.pa;
  }

  applySignatureBurn(target, damage = 2) {
    const statusId = target === this.combat?.hero ? "brulure" : "brulure_legere";
    target.statuses[statusId] = { damage };
  }

  applySignatureParalysis(target, blockChance = 0.25) {
    target.statuses.paralysie = { blockChance };
  }

  applySignatureExposed(target, guardLoss = 3) {
    target.statuses.a_decouvert = { guardLoss, ruptureScale: 0.5 };
  }

  applyGuardRupture(target, guardLoss) {
    const lostGuard = Math.min(target.guard, guardLoss);
    target.guard -= lostGuard;
    const overflow = Math.max(0, guardLoss - lostGuard);
    const ruptureDamage = Math.ceil(overflow * 0.5);
    if (ruptureDamage > 0) applyHitPoints(target, ruptureDamage);
    return { lostGuard, ruptureDamage };
  }

  signatureDamage(source, target, { baseDamage = 2, powerScale = 0.65 } = {}) {
    return Math.max(1, Math.round(baseDamage + source.power * powerScale - target.defense * 0.35));
  }

  signatureEffectKind(signature) {
    return getSignatureEffectKind(signature);
  }

  signatureEffectCanBeMitigated(kind) {
    return canMitigateSignatureEffect(kind);
  }

  signatureComponents(signature, kind) {
    return getSignatureComponents(signature, kind);
  }

  consumeSignatureFeint({ isEnemy, signatureName, canMitigate, partial = false }) {
    const feintReduction = this.combat?.hero.feintReduction;
    if (!isEnemy || !canMitigate || !feintReduction) return false;
    this.combat.hero.feintReduction = null;
    this.addLog(this.t(partial ? "log.signature_feint_partly_mitigates" : "log.signature_feint_mitigates", {
      signature: signatureName
    }));
    this.combatDebug("signature_feint_mitigates", {
      signature: signatureName,
      partial,
      multiplier: feintReduction.multiplier
    });
    return true;
  }

  resolveSignatureEffect(side) {
    return resolveHumanSignatureEffect(this, side);
  }

  applyArtSelfBuffs(action) {
    const combat = this.combat;
    if (!combat) return;
    const selfGuard = action.selfGuard ?? 0;
    if (selfGuard > 0) {
      combat.hero.guard += selfGuard;
      this.addLog(this.t("log.art_self_guard", { guard: selfGuard }));
    }
    const paRefund = action.paRefund ?? 0;
    if (paRefund > 0) {
      const before = combat.hero.pa;
      combat.hero.pa = Math.min(combat.hero.maxPa, combat.hero.pa + paRefund);
      const gained = combat.hero.pa - before;
      if (gained > 0) {
        combat.hero.temporaryPa = Math.min(combat.hero.pa, (combat.hero.temporaryPa ?? 0) + gained);
        this.addLog(this.t("log.art_refund_pa", { ap: gained }));
      }
    }
  }

  playerSignatureAction() {
    const signature = this.combat?.hero.signature;
    if (!isHumanSignatureReady(signature)) {
      this.addLog(this.t("log.signature_not_ready"));
      return;
    }
    this.resolveSignatureEffect("hero");
  }

  playerAction(actionId) {
    const combat = this.combat;
    if (!this.inventoryModalShield.hidden) return;
    if (!combat || combat.ended || combat.damageAnimating || combat.phase !== "player") return;
    const playerActionDefinition = this.actionDefinitions[actionId];
    if (combat.hero.blockedActionId === actionId) {
      return this.addLog(this.t("log.hero_status_paralysis_blocks", {
        action: this.t(playerActionDefinition.nameKey)
      }));
    }
    this.combatDebug("player_action_start", { actionId });
    const heroPaBeforeAction = combat.hero.pa;
    let signatureEvent = { actionId };
    const actions = {
      signature: () => this.playerSignatureAction(),
      entaille: () => {
        if (!this.spendPa(playerActionDefinition.cost)) return this.addLog(this.t("log.no_ap.entaille"));
        signatureEvent = { ...signatureEvent, executed: true };
        this.combatScreen.playHeroEntaille();
        this.objectives.registerHeroActionUse("entaille");
        const result = this.damageEnemy(playerActionDefinition);
        signatureEvent = { ...signatureEvent, hit: result.hit, damage: result.damage };
      },
      garde: () => {
        if (!this.spendPa(playerActionDefinition.cost)) return this.addLog(this.t("log.no_ap.garde"));
        signatureEvent = { ...signatureEvent, executed: true };
        this.objectives.registerHeroActionUse("garde");
        const guard = calculateHeroGuard({ hero: combat.hero, action: playerActionDefinition });
        combat.hero.guard += guard;
        combat.hero.guarding = true;
        signatureEvent = { ...signatureEvent, guardGained: guard };
        this.combatDebug("hero_guard", { actionId, guard });
        this.addLog(this.t("log.garde", { guard }));
        this.objectives.completeByType("guardOnce");
        this.affixes.applyGuard();
      },
      feinte: () => {
        if (!this.spendPa(playerActionDefinition.cost)) return this.addLog(this.t("log.no_ap.feinte"));
        signatureEvent = { ...signatureEvent, executed: true };
        this.objectives.registerHeroActionUse("feinte");
        const interruptedAction = combat.enemy.currentAction;
        const hit = this.damageEnemy(playerActionDefinition);
        signatureEvent = { ...signatureEvent, hit: hit.hit, damage: hit.damage };
        if (hit.hit) {
          this.objectives.completeByType("feintOnce");
          if (interruptedAction?.marked) {
            this.objectives.completeByType("feintSpecial");
          }
          this.prepareFeintReduction();
          if (interruptedAction?.feintable) {
            if (interruptedAction.kind === "art" && combat.enemy.hp > 0) {
              this.applyCreatureArtStatus(interruptedAction, { chanceMultiplier: 0.5, interrupted: true });
            }
            this.interruptCharge(this.t("log.feinte_interrupt"));
          }
        }
      },
      art: () => {
        if (!this.spendPa(playerActionDefinition.cost)) return this.addLog(this.t("log.no_ap.art"));
        // Teintes de build « sur soi » (eau : Garde ; vent : remboursement de PA),
        // appliquées à l'usage, indépendamment de la touche.
        this.applyArtSelfBuffs(playerActionDefinition);
        signatureEvent = { ...signatureEvent, executed: true };
        this.objectives.registerHeroActionUse("art");
        this.objectives.completeByType("artOnce");
        const hit = this.damageEnemy(playerActionDefinition);
        signatureEvent = { ...signatureEvent, hit: hit.hit, damage: hit.damage };
        if (!hit.hit) return;
        const paDenial = playerActionDefinition.enemyPaDamage ?? 0;
        if (paDenial > 0) {
          const enemyPaBefore = combat.enemy.pa;
          combat.enemy.pa = Math.max(0, combat.enemy.pa - paDenial);
          const removed = enemyPaBefore - combat.enemy.pa;
          combat.paDenied.enemy = Math.max(combat.paDenied.enemy ?? 0, removed);
          if (removed > 0) {
            this.addLog(this.t("log.art_remove_ap", {
              art: this.actionName(playerActionDefinition.id),
              creature: this.creatureName(),
              ap: removed
            }));
          }
        }
        if (combat.enemy.charging) this.interruptCharge(this.t("log.art_interrupt"));
      },
      capture: () => {
        if (this.context !== "capture") return;
        if (!this.spendPa(playerActionDefinition.cost)) return this.addLog(this.t("log.no_ap.capture"));
        signatureEvent = { ...signatureEvent, executed: true };
        this.objectives.registerHeroActionUse("capture");
        const stabilityReduction = this.affixes.captureStabilityReduction();
        const chance = calculateCaptureChance({ combat, perception: this.build.perception, stabilityReduction });
        this.combatDebug("capture_attempt", { chance, stabilityReduction });
        if (chance >= 100 || Math.random() * 100 < chance) {
          this.objectives.checkCaptureTiming();
          combat.capture = 100;
          const rewardedAffix = grantEncounterAffixReward({
            baseProgression: this.baseProgression,
            combat,
            combatDebug: (event, details) => this.combatDebug(event, details),
            encounterAffix: this.encounterAffix,
            objectivesData: this.objectivesData,
            setOwnedHuntAffixes: this.setOwnedHuntAffixes
          });
          grantCapturedCreatureReward({
            baseProgression: this.baseProgression,
            combat,
            combatDebug: (event, details) => this.combatDebug(event, details),
            creature: this.creature,
            rewardedAffix
          });
          const successMessage = rewardedAffix
            ? this.t("log.capture_success_with_affix", {
                creature: this.creatureName(),
                affix: this.huntAffixName(rewardedAffix),
                level: huntAffixLevel(this.t, rewardedAffix)
              })
            : this.t("log.capture_success", { creature: this.creatureName() });
          this.endCombat(true, successMessage);
        } else {
          this.addLog(this.t("log.capture_fail", { chance: Math.round(chance) }));
          applyCaptureProgress(combat, calculateFailedCaptureProgress(this.build.perception));
        }
      },
      bag: () => this.inventoryModal?.open(),
      end: () => {
        signatureEvent = { ...signatureEvent, executed: true, savedPa: combat.hero.pa };
        this.turns.endPlayerTurn();
      }
    };

    actions[actionId]?.();
    const actionCost = playerActionDefinition?.cost ?? 0;
    const spentActionPa = heroPaBeforeAction - combat.hero.pa;
    if (!combat.ended && actionId !== "bag" && signatureEvent.executed) {
      const signatureJustCharged = this.chargeSignatureForAction("hero", actionId, playerActionDefinition, signatureEvent);
      if (actionId !== "signature" && !signatureJustCharged) this.announceSignatureReadyReminder();
    }
    if (!combat.ended && actionId !== "end" && actionCost >= 3 && spentActionPa >= actionCost) {
      this.affixes.tryRetourDeGeste(actionId);
    }
    if (!combat.ended) this.combatDebug("player_action_end", { actionId });

    if (!combat.ended && actionId !== "end") {
      this.renderCombatUi();
      this.combatScreen.syncCombat(combat);
    }
  }

  endCombat(won, message, outcome = won ? "capture" : "defeat") {
    const combat = this.combat;
    if (!combat || combat.ended) return;
    const isTrainingCombat = this.context === "human" && this.creature?.training;
    combat.ended = true;
    combat.phase = "done";
    combat.outcome = outcome;
    this.lastCombatResult = {
      context: this.context,
      creatureId: this.creature?.id ?? null,
      outcome,
      training: Boolean(isTrainingCombat),
      won
    };
    if (this.context === "capture" && !combat.huntCompletionRecorded) {
      this.baseProgression.captureHuntsCompleted = (this.baseProgression.captureHuntsCompleted ?? 0) + 1;
      combat.huntCompletionRecorded = true;
    }
    this.combatDebug("combat_end", { won, outcome });
    this.persistHeroHp({
      respawn: outcome === "defeat",
      restoreFull: isTrainingCombat
    });
    this.addLog(message);
    const unspentXpBefore = this.getUnspentXp();
    const currencyReward = isTrainingCombat ? null : grantCombatCurrencyReward({
      baseProgression: this.baseProgression,
      combat,
      combatDebug: (event, details) => this.combatDebug(event, details),
      creature: this.creature,
      outcome
    });
    if (currencyReward) {
      currencyReward.unspentXpBefore = unspentXpBefore;
      currencyReward.unspentXp = this.getUnspentXp();
      this.addRewardLog(this.t("log.rewards_granted", {
        stars: currencyReward.stars,
        gold: currencyReward.gold
      }), currencyReward);
    }
    if (won && !isTrainingCombat) {
      const levelUps = recordEquippedCreatureVictory({
        progression: this.baseProgression,
        equippedCreatures: combat.build?.equippedCreatures ?? []
      });
      levelUps.forEach((levelUp) => {
        const creature = creatures[levelUp.creatureId];
        this.addRewardLog(this.t("log.creature_level_up", {
          creature: this.t(creature?.nameKey ?? levelUp.creatureId),
          level: levelUp.level
        }), levelUp);
      });
    }
    this.addContinueIndicator(() => this.onCombatReadyToContinue(this.lastCombatResult));
    this.renderCombatUi();
    this.combatScreen.showResult(won, outcome);
  }

  renderCombatUi() {
    this.combatScreen.render(this.combat);
  }
}
