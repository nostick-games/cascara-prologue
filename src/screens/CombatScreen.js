import { setPixelButtonLabel } from "../ui/PixelButton.js";
import { nativeHaptic } from "../utils/nativeBridge.js";

const defaultCombatCreatureSpriteFrameCount = 6;
const heroDeathDisappearDelayMs = 1080;
const combatCreatureSpriteScales = {
  desktop: 4,
  mobile: 2.5,
  mobileTall: 2.8
};
const combatCreatureSpriteLayoutCache = new Map();

export class CombatScreen {
  constructor({
    nodes,
    t,
    creature,
    actionDefinitions,
    objectives,
    build,
    guardBarPointScale,
    objectiveLabel,
    onAction,
    onObjectivesClick = null,
    canOpenObjectives = () => false,
    heroName = "Hero"
  }) {
    this.nodes = nodes;
    this.t = t;
    this.creature = creature;
    this.actionDefinitions = actionDefinitions;
    this.baseActionDefinitions = actionDefinitions;
    this.objectives = objectives;
    this.build = build;
    this.guardBarPointScale = guardBarPointScale;
    this.objectiveLabel = objectiveLabel;
    this.previousPaState = null;
    this.onObjectivesClick = onObjectivesClick;
    this.canOpenObjectives = canOpenObjectives;
    this.heroName = heroName;
    this.context = "capture";
    this.visibleActionIds = null;
    this.showObjectives = true;
    this.heroDeathTimeout = null;

    nodes.actionButtons.forEach((button) => {
      button.addEventListener("click", () => onAction(button.dataset.action));
    });
    nodes.combatObjectives?.addEventListener("click", () => {
      if (!this.canOpenObjectives()) return;
      this.onObjectivesClick?.();
    });
  }

  renderStaticText(opponentName) {
    const { nodes, t, creature, actionDefinitions } = this;
    setPixelButtonLabel(nodes.inventoryModalClose, t("ui.ok"));
    nodes.loadingDuelTitle.textContent = t("ui.loading_duel.title");
    nodes.loadingDuelDescription.textContent = t("ui.loading_duel.description");
    nodes.heroBarLabel.textContent = this.heroName;
    nodes.guardBarLabel.textContent = t("ui.shield_guard");
    nodes.enemyBarLabel.textContent = opponentName;
    nodes.enemyGuardBarLabel.textContent = t("ui.enemy_guard");
    nodes.combatObjectivesTitle.textContent = t("ui.capture_objectives");
    nodes.combatObjectives?.setAttribute("aria-label", t("ui.capture_objectives"));
    nodes.enemySprite.setAttribute("aria-label", t(creature.spriteLabelKey));
    const enemySpriteUrl = creature.sprites?.combat ?? creature.sprites?.briefing;
    nodes.enemySprite.style.backgroundImage = `url("${enemySpriteUrl}")`;
    this.applyCreatureCombatSpriteLayout(enemySpriteUrl, creature.sprites?.frameCount);
    nodes.heroSprite.setAttribute("aria-label", this.heroName);

    nodes.actionButtons.forEach((button) => {
      const action = actionDefinitions[button.dataset.action];
      const showCost = !["bag", "end"].includes(action.id);
      const label = `${action.icon} ${t(action.nameKey)}`;
      const labelNode = setPixelButtonLabel(button, label, {
        variant: action.id === "end" ? "combat" : "default"
      });
      const costDots = showCost
        ? Array.from({ length: action.cost }, () => '<span class="action-pa-dot"></span>').join("")
        : "";
      labelNode.innerHTML = `
        <span class="action-main"><span>${action.icon} ${t(action.nameKey)}</span>${showCost ? `<span class="action-pa-cost" aria-label="${t("action.cost", { cost: action.cost })}">${costDots}</span>` : ""}</span>
      `;
    });
  }

  configureEncounter({
    creature,
    objectives,
    context = "capture",
    visibleActionIds = null,
    showObjectives = true,
    actionDefinitions = this.baseActionDefinitions
  }) {
    this.creature = creature;
    this.objectives = objectives;
    this.context = context;
    this.actionDefinitions = actionDefinitions;
    this.visibleActionIds = visibleActionIds ? new Set(visibleActionIds) : null;
    this.showObjectives = showObjectives;
    this.nodes.combatSection?.classList.toggle("human-combat", context === "human");
    this.nodes.combatSection?.classList.toggle("capture-combat", context === "capture");
    this.renderStaticText(this.t(creature.nameKey));
  }

  isObjectiveHidden(objective, combat) {
    if (!objective.hiddenUntilPerception || combat.objectives[objective.id]) return false;
    return (this.build.perception ?? 0) < (combat.enemy.perception ?? 0);
  }

  applyCreatureCombatSpriteLayout(spriteUrl, frameCount = defaultCombatCreatureSpriteFrameCount) {
    const cacheKey = `${spriteUrl}:${frameCount}`;
    const token = Symbol(cacheKey);
    this.creatureCombatSpriteLayoutToken = token;

    const cachedLayout = combatCreatureSpriteLayoutCache.get(cacheKey);
    if (cachedLayout) {
      this.setCreatureCombatSpriteLayout(cachedLayout);
      return;
    }

    this.clearCreatureCombatSpriteLayout();
    this.loadCreatureCombatSpriteLayout(spriteUrl, frameCount).then((layout) => {
      if (this.creatureCombatSpriteLayoutToken !== token) return;
      combatCreatureSpriteLayoutCache.set(cacheKey, layout);
      this.setCreatureCombatSpriteLayout(layout);
    });
  }

  loadCreatureCombatSpriteLayout(spriteUrl, frameCount) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(this.createCreatureCombatSpriteLayout(image, frameCount));
      image.onerror = () => resolve(null);
      image.src = spriteUrl;
    });
  }

  createCreatureCombatSpriteLayout(image, frameCount) {
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const frameWidth = sourceWidth / frameCount;
    const frameHeight = sourceHeight;
    const scales = this.creature.sprites?.combatScale ?? combatCreatureSpriteScales;
    return {
      frameCount,
      desktop: this.createCreatureCombatSpriteLayoutForFrame(frameWidth, frameHeight, frameCount, scales.desktop ?? combatCreatureSpriteScales.desktop),
      mobile: this.createCreatureCombatSpriteLayoutForFrame(frameWidth, frameHeight, frameCount, scales.mobile ?? combatCreatureSpriteScales.mobile),
      mobileTall: this.createCreatureCombatSpriteLayoutForFrame(frameWidth, frameHeight, frameCount, scales.mobileTall ?? combatCreatureSpriteScales.mobileTall)
    };
  }

  createCreatureCombatSpriteLayoutForFrame(frameWidth, frameHeight, frameCount, scale) {
    const width = Math.round(frameWidth * scale);
    const height = Math.round(frameHeight * scale);
    const totalWidth = width * frameCount;
    return {
      width: `${width}px`,
      height: `${height}px`,
      backgroundSize: `${totalWidth}px ${height}px`,
      animationOffset: `-${totalWidth}px`
    };
  }

  clearCreatureCombatSpriteLayout() {
    this.setCreatureCombatSpriteLayout(null);
  }

  setCreatureCombatSpriteLayout(layout) {
    const sprite = this.nodes.enemySprite;
    const frameCount = layout?.frameCount;
    const desktop = layout?.desktop ?? {};
    const mobile = layout?.mobile ?? {};
    const mobileTall = layout?.mobileTall ?? {};
    const values = {
      "--combat-creature-sprite-width": desktop.width,
      "--combat-creature-sprite-height": desktop.height,
      "--combat-creature-sprite-background-size": desktop.backgroundSize,
      "--combat-creature-sprite-offset": desktop.animationOffset,
      "--combat-creature-sprite-mobile-width": mobile.width,
      "--combat-creature-sprite-mobile-height": mobile.height,
      "--combat-creature-sprite-mobile-background-size": mobile.backgroundSize,
      "--combat-creature-sprite-mobile-offset": mobile.animationOffset,
      "--combat-creature-sprite-mobile-tall-width": mobileTall.width,
      "--combat-creature-sprite-mobile-tall-height": mobileTall.height,
      "--combat-creature-sprite-mobile-tall-background-size": mobileTall.backgroundSize,
      "--combat-creature-sprite-mobile-tall-offset": mobileTall.animationOffset,
      "--combat-creature-sprite-steps": frameCount
    };

    Object.entries(values).forEach(([property, value]) => {
      if (value) sprite.style.setProperty(property, value);
      else sprite.style.removeProperty(property);
    });
  }

  boot() {
    this.nodes.phaseCover.remove();
    window.clearTimeout(this.heroDeathTimeout);
    this.heroDeathTimeout = null;
    this.nodes.heroSprite.classList.remove("damage-flash", "hero-hurt", "hero-entaille");
    this.nodes.battleStage.classList.remove("enemy-charging", "enemy-entering", "enemy-captured", "enemy-fled", "hero-defeated", "hero-dying");
    this.nodes.battleStage.classList.add("enemy-awaiting");
    this.previousPaState = null;
  }

  showUi() {
    this.nodes.combatUi.hidden = false;
  }

  capturePaState(combat, phase) {
    if (!combat) return;
    this.previousPaState = {
      phase,
      heroPa: combat.hero.pa,
      heroTemporaryPa: combat.hero.temporaryPa ?? 0,
      enemyPa: combat.enemy.pa,
      enemyTemporaryPa: combat.enemy.temporaryPa ?? 0
    };
  }

  resetPaState() {
    this.previousPaState = null;
  }

  render(combat) {
    if (!combat) return;
    const { nodes, t, actionDefinitions, guardBarPointScale } = this;
    const { hero, enemy } = combat;
    const displayedHeroHp = combat.displayHp?.hero ?? hero.hp;
    const displayedEnemyHp = combat.displayHp?.enemy ?? enemy.hp;

    nodes.heroHpText.textContent = t("ui.hp", { current: displayedHeroHp, max: hero.maxHp });
    nodes.heroHpBar.style.width = `${(displayedHeroHp / hero.maxHp) * 100}%`;
    nodes.guardText.textContent = hero.guard;
    nodes.guardBar.style.width = `${Math.min(100, hero.guard * guardBarPointScale)}%`;
    nodes.enemyHpText.textContent = t("ui.hp", { current: displayedEnemyHp, max: enemy.maxHp });
    nodes.enemyHpBar.style.width = `${(displayedEnemyHp / enemy.maxHp) * 100}%`;
    nodes.enemyGuardText.textContent = enemy.guard;
    nodes.enemyGuardBar.style.width = `${Math.min(100, enemy.guard * guardBarPointScale)}%`;

    this.renderPaDots({
      node: nodes.heroPaDots,
      maxPa: hero.maxPa,
      pa: hero.pa,
      phase: combat.phase,
      activePhase: "player",
      spentFrom: this.previousPaState?.phase === "player" ? this.previousPaState.heroPa : hero.pa,
      deniedCount: combat.paDenied?.hero ?? 0,
      temporaryCount: hero.temporaryPa ?? 0,
      temporarySpentFlashCount: hero.temporaryPaSpentFlash ?? 0,
      previousTemporaryCount: this.previousPaState?.phase === "player" ? this.previousPaState.heroTemporaryPa ?? 0 : hero.temporaryPa ?? 0
    });
    hero.temporaryPaSpentFlash = 0;

    this.renderPaDots({
      node: nodes.enemyPaDots,
      maxPa: enemy.maxPa,
      pa: enemy.pa,
      phase: combat.phase,
      activePhase: "enemy",
      spentFrom: this.previousPaState?.phase === "enemy" ? this.previousPaState.enemyPa : enemy.pa,
      deniedCount: combat.paDenied?.enemy ?? 0,
      temporaryCount: enemy.temporaryPa ?? 0,
      temporarySpentFlashCount: enemy.temporaryPaSpentFlash ?? 0,
      previousTemporaryCount: this.previousPaState?.phase === "enemy" ? this.previousPaState.enemyTemporaryPa ?? 0 : enemy.temporaryPa ?? 0
    });
    enemy.temporaryPaSpentFlash = 0;

    this.capturePaState(combat, combat.phase);
    this.renderObjectives(combat);
    this.renderActionStates(combat);
  }

  renderPaDots({
    node,
    maxPa,
    pa,
    phase,
    activePhase,
    spentFrom,
    deniedCount,
    temporaryCount = 0,
    temporarySpentFlashCount = 0,
    previousTemporaryCount = temporaryCount
  }) {
    node.innerHTML = "";
    const visibleTemporaryCount = phase === activePhase ? Math.min(pa, temporaryCount) : 0;
    for (let index = 0; index < visibleTemporaryCount; index += 1) {
      const dot = document.createElement("span");
      dot.className = "pa-dot on temporary";
      node.append(dot);
    }
    for (let index = 0; index < temporarySpentFlashCount; index += 1) {
      const dot = document.createElement("span");
      dot.className = "pa-dot temporary spent temporary-spent";
      node.append(dot);
    }

    const regularPa = Math.max(0, pa - visibleTemporaryCount);
    const previousRegularPa = Math.max(0, spentFrom - previousTemporaryCount);
    for (let index = 0; index < maxPa; index += 1) {
      const dot = document.createElement("span");
      const denied = index >= maxPa - deniedCount;
      const active = phase === activePhase && index < regularPa;
      const spent = !denied && phase === activePhase && index >= regularPa && index < previousRegularPa;
      dot.className = `pa-dot${active ? " on" : ""}${spent ? " spent" : ""}${denied ? " denied" : ""}`;
      node.append(dot);
    }
  }

  renderObjectives(combat) {
    const { nodes, t, objectives, build, objectiveLabel } = this;
    nodes.combatObjectives.hidden = !this.showObjectives;
    if (!this.showObjectives) {
      nodes.objectives.innerHTML = "";
      return;
    }
    nodes.objectives.innerHTML = "";
    const completedCount = objectives.filter((objective) => combat.objectives[objective.id]).length;
    const compactSlotCount = 4;
    const summary = document.createElement("div");
    summary.className = "combat-objectives-summary";
    summary.innerHTML = `
      <span>${t("ui.capture_objectives")}</span>
      <span class="combat-objective-blocks" aria-hidden="true">
        ${Array.from({ length: compactSlotCount }, (_, index) => (
          `<span class="combat-objective-block${index < completedCount ? " filled" : ""}"></span>`
        )).join("")}
      </span>
    `;
    nodes.objectives.append(summary);

    objectives.forEach((objective) => {
      const hidden = this.isObjectiveHidden(objective, combat);
      const row = document.createElement("div");
      row.className = `objective${combat.objectives[objective.id] ? " done" : ""}${hidden ? " hidden" : ""}`;
      row.textContent = `${combat.objectives[objective.id] ? "✓" : hidden ? "?" : "•"} ${hidden ? t("objective.hidden.combat") : objectiveLabel(objective)}`;
      nodes.objectives.append(row);
    });
  }

  renderActionStates(combat) {
    const { nodes, actionDefinitions } = this;
    nodes.actionButtons.forEach((button) => {
      const action = button.dataset.action;
      const definition = actionDefinitions[action];
      if (action === "signature") {
        this.renderSignatureButton(button, combat);
        return;
      }
      button.hidden = this.visibleActionIds ? !this.visibleActionIds.has(action) : false;
      button.disabled = definition.disabled
        || button.hidden
        || combat.ended
        || combat.damageAnimating
        || combat.phase !== "player"
        || combat.hero.pa < definition.cost
        || combat.hero.blockedActionId === action;
    });
  }

  renderSignatureButton(button, combat) {
    const { t } = this;
    const signature = combat.hero.signature;
    const shouldShow = this.context === "human"
      && (!this.visibleActionIds || this.visibleActionIds.has("signature"))
      && Boolean(signature);
    button.hidden = !shouldShow;
    if (!shouldShow) return;

    const charge = Math.round(signature.charge ?? 0);
    const consumed = Boolean(signature.consumed);
    const ready = charge >= 100 && !signature.pending && !consumed;
    const signatureName = t(signature.nameKey);
    const labelNode = setPixelButtonLabel(button, "", { variant: "default" });
    labelNode.innerHTML = `
      <span class="action-main signature-action-main">
        <span>🔶 ${signatureName}</span>
        <span class="signature-action-charge">${charge}%</span>
      </span>
    `;
    button.style.setProperty("--signature-charge", `${charge}%`);
    button.classList.toggle("signature-action", true);
    button.classList.toggle("ready", ready);
    button.disabled = combat.ended
      || combat.damageAnimating
      || combat.phase !== "player"
      || consumed
      || !ready;
  }

  playEnemyEntrance() {
    const { battleStage, enemySprite } = this.nodes;
    battleStage.classList.remove("enemy-awaiting", "enemy-entering");
    void enemySprite.offsetWidth;
    battleStage.classList.add("enemy-entering");
    window.setTimeout(() => battleStage.classList.remove("enemy-entering"), 620);
  }

  syncCombat(state) {
    if (!state) return;
    this.nodes.battleStage.classList.toggle("enemy-charging", Boolean(state.enemy.charging));
  }

  flashEnemy() {
    nativeHaptic("medium");
    this.flash(this.nodes.enemySprite);
  }

  playHeroEntaille() {
    const sprite = this.nodes.heroSprite;
    sprite.classList.remove("hero-entaille");
    void sprite.offsetWidth;
    sprite.classList.add("hero-entaille");
    window.setTimeout(() => sprite.classList.remove("hero-entaille"), 560);
  }

  flashHero() {
    nativeHaptic("heavy");
    const sprite = this.nodes.heroSprite;
    sprite.classList.remove("damage-flash", "hero-hurt", "hero-entaille");
    void sprite.offsetWidth;
    sprite.classList.add("hero-hurt", "damage-flash");
    window.setTimeout(() => sprite.classList.remove("damage-flash", "hero-hurt"), 1120);
  }

  flash(sprite) {
    sprite.classList.remove("damage-flash");
    void sprite.offsetWidth;
    sprite.classList.add("damage-flash");
    window.setTimeout(() => sprite.classList.remove("damage-flash"), 1120);
  }

  showResult(won, outcome) {
    const { battleStage } = this.nodes;
    window.clearTimeout(this.heroDeathTimeout);
    this.heroDeathTimeout = null;
    battleStage.classList.remove("enemy-charging");
    battleStage.classList.toggle("enemy-captured", won);
    battleStage.classList.toggle("enemy-fled", outcome === "flee");
    battleStage.classList.remove("hero-dying", "hero-defeated");
    if (!won && outcome !== "flee") {
      this.nodes.heroSprite.classList.remove("damage-flash", "hero-hurt", "hero-entaille");
      void this.nodes.heroSprite.offsetWidth;
      battleStage.classList.add("hero-dying");
      this.heroDeathTimeout = window.setTimeout(() => {
        battleStage.classList.add("hero-defeated");
      }, heroDeathDisappearDelayMs);
    }
  }
}
