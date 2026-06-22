import { affixLevelValue } from "./affixEffects.js";
import { rollChance } from "./combatFormulas.js";

export class CombatAffixes {
  constructor({ addLog, combatDebug, creatureName, getCombat, renderCombatUi, syncCombat, t }) {
    this.addLog = addLog;
    this.combatDebug = combatDebug;
    this.creatureName = creatureName;
    this.getCombat = getCombat;
    this.renderCombatUi = renderCombatUi;
    this.syncCombat = syncCombat;
    this.t = t;
  }

  affixForSide(side = "player") {
    const combat = this.getCombat();
    return side === "enemy"
      ? combat.enemyAffix
      : (combat.playerAffix ?? combat.huntAffix);
  }

  actorForSide(side = "player") {
    const combat = this.getCombat();
    return side === "enemy" ? combat.enemy : combat.hero;
  }

  affixUseKey(side, affix) {
    return `${side}:${affix.id}`;
  }

  prepareRafale(side = "player") {
    const combat = this.getCombat();
    const affix = this.affixForSide(side);
    if (!affix || affix.trigger !== "attaque_adverse_ratee") return;
    if (affix.targetSkill !== "entaille") return;
    const key = this.affixUseKey(side, affix);
    if (combat.affixTurnUses[key] === combat.turn) return;

    const bonus = affixLevelValue(affix, affix.effect?.critBonusByLevel, 10);
    this.actorForSide(side).nextEntailleCritBonus = bonus;
    combat.affixTurnUses[key] = combat.turn;
    this.combatDebug("hunt_affix_rafale_ready", {
      affixId: affix.id,
      side,
      bonus,
      turn: combat.turn
    });
    this.addLog(this.t(side === "enemy" ? "log.enemy_affix_rafale_ready" : "log.affix_rafale_ready", {
      creature: this.creatureName(),
      bonus
    }));
  }

  consumeRafale(actionId, side = "player") {
    const actor = this.actorForSide(side);
    if (actionId !== "entaille" || !actor.nextEntailleCritBonus) return;
    const bonus = actor.nextEntailleCritBonus;
    actor.nextEntailleCritBonus = 0;
    this.combatDebug("hunt_affix_rafale_used", { side, bonus });
  }

  applyMorsureSure(actionId, side = "player") {
    const combat = this.getCombat();
    const affix = this.affixForSide(side);
    if (!affix || affix.trigger !== "premiere_entaille") return 0;
    if (actionId !== "entaille" || affix.targetSkill !== "entaille") return 0;
    const key = this.affixUseKey(side, affix);
    if (combat.affixUses[key]) return 0;

    const bonus = affixLevelValue(affix, affix.effect?.damageBonusByLevel, 1);
    combat.affixUses[key] = 1;
    this.combatDebug("hunt_affix_morsure_sure_used", {
      affixId: affix.id,
      side,
      bonus
    });
    this.addLog(this.t(side === "enemy" ? "log.enemy_affix_morsure_sure" : "log.affix_morsure_sure", {
      creature: this.creatureName()
    }));
    return bonus;
  }

  prepareConcentration(side = "player") {
    const combat = this.getCombat();
    const affix = this.affixForSide(side);
    const actor = this.actorForSide(side);
    if (!affix || affix.trigger !== "tour_fini_avec_pa") return;
    const key = this.affixUseKey(side, affix);
    if (combat.affixUses[key]) return;
    if (actor.pa < 1) return;

    const bonus = affixLevelValue(affix, affix.effect?.damageMultiplierBonusByLevel, 0.05);
    actor.nextAttackDamageMultiplierBonus = bonus;
    combat.affixUses[key] = 1;
    this.combatDebug("hunt_affix_concentration_ready", {
      affixId: affix.id,
      side,
      bonus
    });
    this.addLog(this.t(side === "enemy" ? "log.enemy_affix_concentration_ready" : "log.affix_concentration_ready", {
      creature: this.creatureName()
    }));
  }

  applyConcentration(actionId, damage, side = "player") {
    const actor = this.actorForSide(side);
    if (!actor.nextAttackDamageMultiplierBonus) return damage;
    const bonus = actor.nextAttackDamageMultiplierBonus;
    actor.nextAttackDamageMultiplierBonus = 0;
    const boostedDamage = Math.max(damage + 1, Math.round(damage * (1 + bonus)));
    this.combatDebug("hunt_affix_concentration_used", {
      actionId,
      side,
      bonus,
      baseDamage: damage,
      boostedDamage
    });
    return boostedDamage;
  }

  applyCritical(critical, side = "player") {
    const combat = this.getCombat();
    if (!critical) return;
    const affix = this.affixForSide(side);
    const key = affix ? this.affixUseKey(side, affix) : null;
    if (!affix || affix.trigger !== "premier_critique" || combat.affixUses[key]) return;
    if (affix.effect?.applyStatus !== "brulure_legere") return;

    const damage = affixLevelValue(affix, affix.effect.statusDamageByLevel, 2);
    if (side === "enemy") {
      combat.hero.statuses.brulure = { damage };
    } else {
      combat.enemy.statuses.brulure_legere = { damage };
    }
    combat.affixUses[key] = 1;
    this.combatDebug("hunt_affix_status_applied", {
      affixId: affix.id,
      side,
      status: "brulure_legere",
      damage
    });
    this.addLog(this.t(side === "enemy" ? "log.enemy_affix_burn_applied" : "log.affix_burn_applied", {
      creature: this.creatureName(),
      damage
    }));
  }

  applyGuard(side = "player") {
    const combat = this.getCombat();
    const affix = this.affixForSide(side);
    if (!affix || affix.trigger !== "garde_utilisee") return 0;
    if (affix.targetSkill !== "garde") return 0;
    const key = this.affixUseKey(side, affix);
    if (combat.affixTurnUses[key] === combat.turn) return 0;

    const bonus = affixLevelValue(affix, affix.effect?.shieldBonusByLevel, 2);
    this.actorForSide(side).guard += bonus;
    combat.affixTurnUses[key] = combat.turn;
    this.combatDebug("hunt_affix_guard_bonus", {
      affixId: affix.id,
      side,
      bonus,
      turn: combat.turn
    });
    this.addLog(this.t(side === "enemy" ? "log.enemy_affix_guard_bonus" : "log.affix_guard_bonus", {
      creature: this.creatureName(),
      bonus
    }));
    return bonus;
  }

  captureStabilityReduction() {
    const combat = this.getCombat();
    const affix = this.affixForSide("player");
    if (!affix || affix.trigger !== "objectif_capture_complete") return 0;
    if (affix.targetSkill !== "capture") return 0;
    const completedObjectives = Object.values(combat.objectives).filter(Boolean).length;
    if (completedObjectives < 1) return 0;

    return affixLevelValue(affix, affix.effect?.captureStabilityPenaltyByLevel, 2);
  }

  tryGainAp({ debugEvent, failureLogKey, logWhenFull = false, side = "player", successLogKey, trigger, oncePerTurn = false }) {
    const combat = this.getCombat();
    const affix = this.affixForSide(side);
    const actor = this.actorForSide(side);
    if (!affix || affix.trigger !== trigger) return false;
    if (!affix.effect?.apGain) return false;
    const key = this.affixUseKey(side, affix);
    if (oncePerTurn && combat.affixTurnUses[key] === combat.turn) return false;

    const chance = affixLevelValue(affix, affix.effect?.apGainChanceByLevel, 0);
    const gain = affix.effect.apGain;
    if (oncePerTurn) combat.affixTurnUses[key] = combat.turn;

    if (actor.pa >= actor.maxPa) {
      if (logWhenFull) {
        this.combatDebug(`${debugEvent}_failed`, {
          affixId: affix.id,
          side,
          chance,
          gain,
          reason: "pa_full",
          turn: combat.turn
        });
        this.addLog(this.t(failureLogKey, { creature: this.creatureName() }));
      }
      return false;
    }

    if (!rollChance(chance / 100)) {
      this.combatDebug(`${debugEvent}_failed`, {
        affixId: affix.id,
        side,
        chance,
        gain,
        turn: combat.turn
      });
      this.addLog(this.t(failureLogKey, { creature: this.creatureName() }));
      return false;
    }

    const paBefore = actor.pa;
    actor.pa = Math.min(actor.maxPa, actor.pa + gain);
    this.combatDebug(`${debugEvent}_used`, {
      affixId: affix.id,
      side,
      chance,
      gain,
      paBefore,
      paAfter: actor.pa,
      turn: combat.turn
    });
    this.addLog(this.t(successLogKey, { creature: this.creatureName(), gain }));
    this.renderCombatUi();
    this.syncCombat(combat);
    return true;
  }

  trySouffleRelatif(side = "player") {
    return this.tryGainAp({
      debugEvent: "hunt_affix_souffle_relatif",
      failureLogKey: side === "enemy" ? "log.enemy_affix_souffle_relatif_fail" : "log.affix_souffle_relatif_fail",
      logWhenFull: true,
      oncePerTurn: true,
      side,
      successLogKey: side === "enemy" ? "log.enemy_affix_souffle_relatif_success" : "log.affix_souffle_relatif_success",
      trigger: "debut_tour_joueur"
    });
  }

  tryElanDeSurvie(previousHp, side = "player") {
    const actor = this.actorForSide(side);
    if (previousHp < actor.maxHp / 2) return false;
    if (actor.hp >= actor.maxHp / 2) return false;

    return this.tryGainAp({
      debugEvent: "hunt_affix_elan_de_survie",
      failureLogKey: side === "enemy" ? "log.enemy_affix_elan_de_survie_fail" : "log.affix_elan_de_survie_fail",
      side,
      successLogKey: side === "enemy" ? "log.enemy_affix_elan_de_survie_success" : "log.affix_elan_de_survie_success",
      trigger: "heros_sous_moitie_pv"
    });
  }

  tryRetourDeGeste(actionId, side = "player") {
    return this.tryGainAp({
      debugEvent: "hunt_affix_retour_de_geste",
      failureLogKey: side === "enemy" ? "log.enemy_affix_retour_de_geste_fail" : "log.affix_retour_de_geste_fail",
      oncePerTurn: true,
      side,
      successLogKey: side === "enemy" ? "log.enemy_affix_retour_de_geste_success" : "log.affix_retour_de_geste_success",
      trigger: "apres_action_3_pa"
    });
  }

  applyEcaille(side = "player") {
    const combat = this.getCombat();
    const affix = this.affixForSide(side);
    const actor = this.actorForSide(side);
    if (!affix || affix.trigger !== "heros_sous_moitie_pv") return;
    const key = this.affixUseKey(side, affix);
    if (combat.affixUses[key]) return;
    if (actor.hp > actor.maxHp / 2) return;

    const bonus = affixLevelValue(affix, affix.effect?.shieldBonusByLevel, 3);
    actor.guard += bonus;
    combat.affixUses[key] = 1;
    this.combatDebug("hunt_affix_ecaille_used", {
      affixId: affix.id,
      side,
      bonus,
      hp: actor.hp,
      maxHp: actor.maxHp
    });
    this.addLog(this.t(side === "enemy" ? "log.enemy_affix_ecaille_guard" : "log.affix_ecaille_guard", {
      creature: this.creatureName(),
      bonus
    }));
    this.renderCombatUi();
    this.syncCombat(combat);
  }
}
