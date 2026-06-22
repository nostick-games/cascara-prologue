import { absorbGuard, applyHitPoints } from "./combatFormulas.js";
import { resetHumanSignature } from "./humanSignatures.js";

export function resolveSignatureEffect(controller, side) {
  const combat = controller.combat;
  if (!combat || combat.ended) return false;
  const isEnemy = side === "enemy";
  const source = isEnemy ? combat.enemy : combat.hero;
  const target = isEnemy ? combat.hero : combat.enemy;
  const signature = source.signature;
  if (!signature) return false;
  const sourceName = isEnemy ? controller.creatureName() : controller.heroName;
  const targetName = isEnemy ? controller.heroName : controller.creatureName();
  const signatureName = controller.signatureName(signature);
  const kind = controller.signatureEffectKind(signature);
  const components = controller.signatureComponents(signature, kind);
  const hasMitigableDirect = components.direct.some((element) => ["fire", "wind"].includes(element));
  const hasUnmitigatedDirect = components.direct.some((element) => !["fire", "wind"].includes(element));
  const directEffectMitigated = controller.consumeSignatureFeint({
    isEnemy,
    signatureName,
    canMitigate: hasMitigableDirect && controller.signatureEffectCanBeMitigated(kind),
    partial: hasUnmitigatedDirect
  });

  const effects = [];
  const targetKey = isEnemy ? "hero" : "enemy";
  const hpBefore = combat.displayHp?.[isEnemy ? "hero" : "enemy"] ?? target.hp;
  let totalDamage = 0;

  if (components.direct.includes("fire") && !directEffectMitigated) {
    const baseDamage = signature.rank >= 2 ? 4 : 3;
    const reducedScale = components.reducedDirect ? 0.65 : 1;
    const assaultBonus = components.assaultBonus && target.pa <= 0 ? 3 : 0;
    let fireDamage = Math.max(1, Math.round(controller.signatureDamage(source, target, {
      baseDamage,
      powerScale: 0.65
    }) * reducedScale)) + assaultBonus;
    if (fireDamage > 0 && target.guard > 0) {
      const guardResult = absorbGuard(target, fireDamage);
      fireDamage = guardResult.damage;
    }
    if (fireDamage > 0) {
      applyHitPoints(target, fireDamage);
      totalDamage += fireDamage;
    }
    effects.push(controller.t("log.signature_effect_fire_damage", { damage: fireDamage, target: targetName }));
  }

  if (target.hp > 0 && components.direct.includes("water")) {
    const deniedPa = controller.denySignaturePa(isEnemy ? "hero" : "enemy", 1);
    effects.push(controller.t("log.signature_effect_water_pa", { ap: deniedPa, target: targetName }));
  }

  if (target.hp > 0 && components.direct.includes("wind") && !directEffectMitigated) {
    const guardLoss = signature.rank >= 2 ? 5 : 4;
    const reducedGuardLoss = components.reducedDirect ? Math.max(1, Math.round(guardLoss * 0.75)) : guardLoss;
    const { lostGuard, ruptureDamage } = controller.applyGuardRupture(target, reducedGuardLoss);
    totalDamage += ruptureDamage;
    effects.push(controller.t("log.signature_effect_wind_break", {
      guard: lostGuard,
      damage: ruptureDamage,
      target: targetName
    }));
  }

  if (target.hp > 0 && components.secondary.includes("fire")) {
    controller.applySignatureBurn(target, signature.rank >= 2 ? 3 : 2);
    effects.push(controller.t("log.signature_effect_burn"));
  }

  if (target.hp > 0 && components.secondary.includes("water")) {
    controller.applySignatureParalysis(target);
    effects.push(controller.t("log.signature_effect_paralysis"));
  }

  if (target.hp > 0 && components.secondary.includes("wind")) {
    controller.applySignatureExposed(target, signature.rank >= 2 ? 3 : 2);
    effects.push(controller.t("log.signature_effect_exposed"));
  }

  if (target.hp > 0 && components.utility) {
    const gain = controller.grantSignaturePa(source, 1);
    effects.push(controller.t("log.signature_effect_utility_pa", { creature: sourceName, gain }));
  }

  if (effects.length === 0) {
    effects.push(controller.t("log.signature_effect_none"));
  }

  const message = controller.t("log.signature_effect_summary", {
    creature: sourceName,
    signature: signatureName,
    effects: effects.join(", ")
  });

  resetHumanSignature(signature, { consumed: true });
  controller.renderCombatUi();

  if (totalDamage > 0) {
    combat.displayHp[targetKey] = hpBefore;
    controller.queueDamageFeedback({
      targetKey,
      message,
      flash: () => (isEnemy ? controller.combatScreen.flashHero() : controller.combatScreen.flashEnemy()),
      onSettled: target.hp <= 0
        ? () => (isEnemy ? controller.endCombat(false, controller.t("log.human_defeat")) : controller.endEnemyFlee())
        : null
    });
    return "queued";
  }

  controller.addLog(message);
  if (target.hp <= 0) {
    if (isEnemy) controller.endCombat(false, controller.t("log.human_defeat"));
    else controller.endEnemyFlee();
  }
  return true;
}
