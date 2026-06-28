import { calculateCaptureChance } from "./combatFormulas.js";

const defaultCombatBotConfig = {
  captureChanceThreshold: 68,
  decisionDelayMs: 520,
  pollIntervalMs: 180,
  continueAfterCombatDelayMs: 1400
};

function hpRatio(actor) {
  if (!actor?.maxHp) return 0;
  return actor.hp / actor.maxHp;
}

function isSignatureReady(signature) {
  return Boolean(signature && signature.charge >= 100 && !signature.pending && !signature.consumed);
}

function combatLabel(combat) {
  return `${combat.enemy?.name ?? "Adversaire"} T${combat.turn}`;
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function rowsToCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))
  ].join("\n");
}

function downloadTextFile({ filename, text, type = "text/csv;charset=utf-8" }) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function chooseCombatBotAction({
  actionDefinitions,
  combat,
  context,
  perception = combat?.build?.perception ?? 0
}) {
  if (!combat || combat.ended || combat.phase !== "player") {
    return { actionId: null, reason: "not-player-turn" };
  }

  const { hero, enemy } = combat;
  const canUse = (actionId) => {
    const action = actionDefinitions?.[actionId];
    return Boolean(action)
      && hero.pa >= (action.cost ?? 0)
      && hero.blockedActionId !== actionId;
  };

  if (canUse("signature") && isSignatureReady(hero.signature)) {
    return { actionId: "signature", reason: "signature-ready" };
  }

  if (context === "capture" && canUse("capture")) {
    const chance = calculateCaptureChance({ combat, perception });
    if (chance >= defaultCombatBotConfig.captureChanceThreshold) {
      return { actionId: "capture", reason: `capture-chance-${Math.round(chance)}` };
    }
    if (hpRatio(enemy) <= 0.35 && combat.capture >= 35) {
      return { actionId: "capture", reason: "enemy-weakened" };
    }
  }

  if ((enemy.charging || enemy.markedAttack) && canUse("feinte")) {
    return { actionId: "feinte", reason: "interrupt-threat" };
  }

  if (hpRatio(hero) <= 0.35 && canUse("garde") && hero.guard <= 1) {
    return { actionId: "garde", reason: "low-health-guard" };
  }

  if (canUse("art") && (enemy.pa > 0 || hpRatio(enemy) >= 0.45)) {
    return { actionId: "art", reason: "pressure-art" };
  }

  if (canUse("feinte") && enemy.currentAction?.feintable && hero.pa >= 2) {
    return { actionId: "feinte", reason: "feintable-plan" };
  }

  if (canUse("entaille")) {
    return { actionId: "entaille", reason: "basic-attack" };
  }

  if (context === "capture" && canUse("capture")) {
    return { actionId: "capture", reason: "fallback-capture" };
  }

  return { actionId: "end", reason: "no-affordable-action" };
}

export function createCombatBot({
  action,
  getActionDefinitions,
  getCombat,
  getContext,
  getPerception,
  onContinue,
  config = {}
}) {
  const settings = { ...defaultCombatBotConfig, ...config };
  let enabled = false;
  let timer = null;
  let pendingDecision = false;
  let currentCombat = null;
  let combatStats = null;
  const history = [];
  const reportedCombats = new WeakSet();

  function startStats(combat) {
    currentCombat = combat;
    combatStats = {
      actions: {},
      decisions: [],
      enemyName: combat.enemy?.name ?? "Adversaire",
      context: getContext(),
      startHeroHp: combat.hero?.hp ?? 0,
      startHeroMaxHp: combat.hero?.maxHp ?? 0,
      startEnemyHp: combat.enemy?.hp ?? 0,
      startEnemyMaxHp: combat.enemy?.maxHp ?? 0,
      startedAt: performance.now(),
      turnsSeen: combat.turn ?? 1
    };
    console.info("[CombatBot] Nouveau combat", {
      enemy: combatStats.enemyName,
      context: combatStats.context,
      heroHp: combatStats.startHeroHp,
      enemyHp: combatStats.startEnemyHp
    });
  }

  function recordAction(actionId, decision, combat) {
    if (!combatStats || !actionId) return;
    combatStats.actions[actionId] = (combatStats.actions[actionId] ?? 0) + 1;
    combatStats.decisions.push({
      action: actionId,
      capture: combat.capture ?? 0,
      enemyHp: combat.enemy?.hp ?? 0,
      heroHp: combat.hero?.hp ?? 0,
      reason: decision?.reason ?? "",
      turn: combat.turn ?? 0
    });
  }

  function createHistoryRow(combat, durationSeconds) {
    const actions = combatStats?.actions ?? {};
    return {
      run: history.length + 1,
      enemy: combat.enemy?.name ?? combatStats?.enemyName ?? "",
      context: combatStats?.context ?? getContext(),
      outcome: combat.outcome ?? "",
      won: combat.outcome !== "defeat",
      turns: combat.turn ?? combatStats?.turnsSeen ?? 0,
      durationSeconds,
      heroStartHp: combatStats?.startHeroHp ?? "",
      heroStartMaxHp: combatStats?.startHeroMaxHp ?? "",
      heroEndHp: combat.hero?.hp ?? "",
      heroEndMaxHp: combat.hero?.maxHp ?? "",
      enemyStartHp: combatStats?.startEnemyHp ?? "",
      enemyStartMaxHp: combatStats?.startEnemyMaxHp ?? "",
      enemyEndHp: combat.enemy?.hp ?? "",
      enemyEndMaxHp: combat.enemy?.maxHp ?? "",
      capture: combat.capture ?? "",
      actionEntaille: actions.entaille ?? 0,
      actionGarde: actions.garde ?? 0,
      actionFeinte: actions.feinte ?? 0,
      actionArt: actions.art ?? 0,
      actionCapture: actions.capture ?? 0,
      actionSignature: actions.signature ?? 0,
      actionEnd: actions.end ?? 0,
      actionSequence: combatStats?.decisions.map((decision) => decision.action).join(" ") ?? "",
      reasonSequence: combatStats?.decisions.map((decision) => decision.reason).join(" | ") ?? ""
    };
  }

  function reportCombat(combat) {
    if (!combat || reportedCombats.has(combat)) return;
    reportedCombats.add(combat);
    const durationSeconds = combatStats
      ? Math.round((performance.now() - combatStats.startedAt) / 100) / 10
      : null;
    const historyRow = createHistoryRow(combat, durationSeconds);
    history.push(historyRow);
    console.info("[CombatBot] Resultat combat", {
      enemy: combat.enemy?.name,
      outcome: combat.outcome,
      won: combat.outcome !== "defeat",
      turns: combat.turn,
      heroHp: `${combat.hero.hp}/${combat.hero.maxHp}`,
      enemyHp: `${combat.enemy.hp}/${combat.enemy.maxHp}`,
      capture: combat.capture,
      actions: combatStats?.actions ?? {},
      durationSeconds,
      exportRows: history.length
    });
    window.setTimeout(() => onContinue?.(), settings.continueAfterCombatDelayMs);
  }

  function tick() {
    if (!enabled) return;
    const combat = getCombat();
    if (!combat) return;

    if (combat !== currentCombat && !combat.ended) {
      startStats(combat);
    }

    if (combatStats) {
      combatStats.turnsSeen = Math.max(combatStats.turnsSeen, combat.turn ?? 1);
    }

    if (combat.ended) {
      reportCombat(combat);
      return;
    }

    if (pendingDecision || combat.damageAnimating || combat.playerInputLocked || combat.phase !== "player") {
      return;
    }

    pendingDecision = true;
    window.setTimeout(() => {
      pendingDecision = false;
      const freshCombat = getCombat();
      if (!enabled || freshCombat !== combat || freshCombat.ended || freshCombat.phase !== "player") return;
      if (freshCombat.damageAnimating || freshCombat.playerInputLocked) return;

      const decision = chooseCombatBotAction({
        actionDefinitions: getActionDefinitions(),
        combat: freshCombat,
        context: getContext(),
        perception: getPerception()
      });
      if (!decision.actionId) return;
      console.debug("[CombatBot] Action", {
        action: decision.actionId,
        reason: decision.reason,
        combat: combatLabel(freshCombat),
        heroPa: freshCombat.hero.pa,
        heroHp: `${freshCombat.hero.hp}/${freshCombat.hero.maxHp}`,
        enemyHp: `${freshCombat.enemy.hp}/${freshCombat.enemy.maxHp}`,
        capture: freshCombat.capture
      });
      recordAction(decision.actionId, decision, freshCombat);
      action(decision.actionId);
    }, settings.decisionDelayMs);
  }

  function exportCsv() {
    const csv = rowsToCsv(history);
    console.info(`[CombatBot] CSV pret (${history.length} combat${history.length > 1 ? "s" : ""}).`);
    return csv;
  }

  function downloadCsv(filename = "combat-bot-runs.csv") {
    const csv = exportCsv();
    if (!csv) {
      console.warn("[CombatBot] Aucun combat a exporter.");
      return "";
    }
    downloadTextFile({ filename, text: csv });
    return csv;
  }

  function printSummary() {
    if (!history.length) {
      console.info("[CombatBot] Aucun combat dans l'historique.");
      return [];
    }
    console.table(history);
    return history;
  }

  function clearHistory() {
    history.length = 0;
    console.info("[CombatBot] Historique vide.");
  }

  function start() {
    if (enabled) return;
    enabled = true;
    timer = window.setInterval(tick, settings.pollIntervalMs);
    console.info("[CombatBot] Active");
  }

  function stop() {
    enabled = false;
    pendingDecision = false;
    if (timer) window.clearInterval(timer);
    timer = null;
    console.info("[CombatBot] Arrete");
  }

  return {
    clearHistory,
    downloadCsv,
    exportCsv,
    history,
    printSummary,
    start,
    stop,
    isEnabled: () => enabled
  };
}
