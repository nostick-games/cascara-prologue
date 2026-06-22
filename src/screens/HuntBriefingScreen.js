import { StatRadar } from "../ui/StatRadar.js";
import { bindPress } from "../ui/bindPress.js";
import { setPixelButtonLabel } from "../ui/PixelButton.js";
import { renderInstinctList } from "../ui/instinctList.js";
import { captureRewardPreview } from "../data/captureRewards.js";

const defaultBriefingSpriteFrameCount = 6;
const briefingSpriteScales = {
  desktop: 6,
  mobile: 3
};
const briefingSpriteOffsets = {
  desktop: { x: 0, y: 20 },
  mobile: { x: -90, y: -100 }
};
const briefingSpriteLayoutCache = new Map();
const romanLevels = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export class HuntBriefingScreen {
  constructor({
    nodes,
    t,
    creature,
    encounterIntroKey,
    stats,
    build,
    initialBuild,
    resetBuild,
    totalPoints,
    objectives,
    encounterAffix,
    ownedHuntAffixes,
    selectedHuntAffixId,
    isLocked,
    onChange,
    onStart,
    onReset,
    onFlee = () => {},
    onModalStateChange = () => {}
  }) {
    this.nodes = nodes;
    this.t = t;
    this.creature = creature;
    this.encounterIntroKey = encounterIntroKey;
    this.build = build;
    this.objectives = objectives;
    this.encounterAffix = encounterAffix;
    this.ownedHuntAffixes = ownedHuntAffixes;
    this.selectedHuntAffixId = selectedHuntAffixId;
    this.isLocked = isLocked;
    this.onChange = onChange;
    this.onStart = onStart;
    this.onReset = onReset;
    this.onFlee = onFlee;
    this.onModalStateChange = onModalStateChange;

    this.radar = new StatRadar({
      canvas: nodes.radarCanvas,
      controlsNode: nodes.statsNode,
      modal: nodes.radarModal,
      modalTitle: nodes.radarModalTitle,
      modalDescription: nodes.radarModalDescription,
      modalPoints: nodes.radarModalPoints,
      modalClose: nodes.radarModalClose,
      modalShield: nodes.radarModalShield,
      stats,
      build,
      initialBuild,
      resetBuild,
      totalPoints,
      t,
      isLocked,
      onChange
    });

    bindPress(nodes.behaviorButton, () => this.openModal("behavior"));
    bindPress(nodes.captureConditionsButton, () => this.openConditionsModal());
    bindPress(nodes.affixButton, () => this.openModal("affix"));
    bindPress(nodes.briefingModalClose, () => this.closeModal());
    bindPress(nodes.resetBuildButton, () => {
      if (!this.canResetBuild()) return;
      this.onReset();
    });
    bindPress(nodes.fleeButton, () => {
      if (this.isLocked()) return;
      this.onFlee();
    });
    bindPress(nodes.startCaptureButton, () => {
      if (this.isLocked()) return;
      this.onStart();
    });
  }

  renderStaticText() {
    const { nodes, t } = this;
    setPixelButtonLabel(nodes.behaviorButton, t("ui.behavior"));
    setPixelButtonLabel(nodes.captureConditionsButton, t("ui.capture_conditions"));
    nodes.affixButton.textContent = t("ui.affix");
    nodes.radarCanvas.setAttribute("aria-label", t("ui.radar.title"));
    setPixelButtonLabel(nodes.radarModalClose, t("ui.ok"));
    setPixelButtonLabel(nodes.briefingModalClose, t("ui.ok"));
    setPixelButtonLabel(nodes.resetBuildButton, "♺");
    nodes.resetBuildButton.setAttribute("aria-label", t("ui.reset"));
    nodes.resetBuildButton.title = t("ui.reset");
    setPixelButtonLabel(nodes.affixButton, t("ui.affix"));
    setPixelButtonLabel(nodes.fleeButton, t("ui.flee"));
    setPixelButtonLabel(nodes.startCaptureButton, t("ui.combat"), { variant: "combat" });
  }

  configureEncounter({
    creature,
    encounterIntroKey,
    objectives,
    encounterAffix,
    ownedHuntAffixes,
    selectedHuntAffixId,
    totalPoints
  }) {
    this.creature = creature;
    this.encounterIntroKey = encounterIntroKey;
    this.objectives = objectives;
    this.encounterAffix = encounterAffix;
    this.ownedHuntAffixes = ownedHuntAffixes;
    this.selectedHuntAffixId = selectedHuntAffixId;
    this.radar.setTotalPoints(totalPoints);
  }

  render() {
    this.renderStaticText();
    this.renderCreature();
    this.renderStats();
  }

  playRadarIntro() {
    this.radar.playIntro();
  }

  renderStats() {
    const { nodes } = this;
    nodes.pointsLeft.textContent = this.radar.pointsLeft();
    nodes.pointsUnit.innerHTML = `<img src="assets/inventaire/gemme.png" alt="XP" class="points-icon">`;
    nodes.startCaptureButton.disabled = this.isLocked();
    nodes.resetBuildButton.disabled = !this.canResetBuild();
    nodes.affixButton.disabled = this.isLocked();
    nodes.fleeButton.disabled = this.isLocked();
    this.radar.render();
  }

  canResetBuild() {
    return !this.isLocked() && this.radar.resettableSpentPoints() > 0;
  }

  renderCreature() {
    const { nodes, t, creature } = this;
    const name = this.creatureName();
    nodes.creatureStage.setAttribute("aria-label", t(creature.stageLabelKey));
    nodes.creatureStage.dataset.creatureType = creature.type ?? "";
    nodes.huntCreatureType.textContent = t(`affix.type.${creature.type}`);
    nodes.huntCreatureLevel.textContent = this.creatureLevelLabel();
    nodes.creatureSprite.setAttribute("aria-label", t(creature.spriteLabelKey));
    const spriteUrl = creature.sprites?.briefing ?? creature.sprites?.combat;
    nodes.creatureSprite.style.backgroundImage = `url("${spriteUrl}")`;
    this.applyBriefingSpriteLayout(spriteUrl, creature.sprites?.frameCount);
    nodes.encounterSentence.innerHTML = t(this.encounterIntroKey, {
      creature: `<span class="creature-inline">${name}</span>`
    });
  }

  creatureLevelLabel() {
    const level = this.creature.combat?.stats?.level ?? 1;
    return `n.${romanLevels[level] ?? level}`;
  }

  applyBriefingSpriteLayout(spriteUrl, frameCount = defaultBriefingSpriteFrameCount) {
    const cacheKey = `${spriteUrl}:${frameCount}`;
    const token = Symbol(cacheKey);
    this.briefingSpriteLayoutToken = token;

    const cachedLayout = briefingSpriteLayoutCache.get(cacheKey);
    if (cachedLayout) {
      this.setBriefingSpriteLayout(cachedLayout);
      return;
    }

    this.clearBriefingSpriteLayout();
    this.loadBriefingSpriteLayout(spriteUrl, frameCount).then((layout) => {
      if (this.briefingSpriteLayoutToken !== token) return;
      briefingSpriteLayoutCache.set(cacheKey, layout);
      this.setBriefingSpriteLayout(layout);
    });
  }

  loadBriefingSpriteLayout(spriteUrl, frameCount) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(this.createBriefingSpriteLayout(image, frameCount));
      image.onerror = () => resolve(null);
      image.src = spriteUrl;
    });
  }

  createBriefingSpriteLayout(image, frameCount) {
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const frameWidth = sourceWidth / frameCount;
    const frameHeight = sourceHeight;
    const desktop = this.createBriefingSpriteLayoutForFrame(
      frameWidth,
      frameHeight,
      frameCount,
      briefingSpriteScales.desktop,
      briefingSpriteOffsets.desktop
    );
    const mobile = this.createBriefingSpriteLayoutForFrame(
      frameWidth,
      frameHeight,
      frameCount,
      briefingSpriteScales.mobile,
      briefingSpriteOffsets.mobile
    );
    return {
      frameCount,
      desktop,
      mobile
    };
  }

  createBriefingSpriteLayoutForFrame(frameWidth, frameHeight, frameCount, scale, offset) {
    const width = Math.round(frameWidth * scale);
    const height = Math.round(frameHeight * scale);
    const totalWidth = width * frameCount;
    return {
      width: `${width}px`,
      height: `${height}px`,
      backgroundSize: `${totalWidth}px ${height}px`,
      animationOffset: `-${totalWidth}px`,
      transform: `translate(${offset.x}px, ${offset.y}px) translateZ(0)`
    };
  }

  clearBriefingSpriteLayout() {
    this.setBriefingSpriteLayout(null);
  }

  setBriefingSpriteLayout(layout) {
    const sprite = this.nodes.creatureSprite;
    const frameCount = layout?.frameCount;
    const desktop = layout?.desktop ?? {};
    const mobile = layout?.mobile ?? {};
    const values = {
      "--briefing-sprite-width": desktop.width,
      "--briefing-sprite-height": desktop.height,
      "--briefing-sprite-background-size": desktop.backgroundSize,
      "--briefing-sprite-desktop-offset": desktop.animationOffset,
      "--briefing-sprite-transform": desktop.transform,
      "--briefing-sprite-mobile-width": mobile.width,
      "--briefing-sprite-mobile-height": mobile.height,
      "--briefing-sprite-mobile-background-size": mobile.backgroundSize,
      "--briefing-sprite-mobile-offset": mobile.animationOffset,
      "--briefing-sprite-mobile-transform": mobile.transform,
      "--briefing-sprite-steps": frameCount
    };

    Object.entries(values).forEach(([property, value]) => {
      if (value) sprite.style.setProperty(property, value);
      else sprite.style.removeProperty(property);
    });
  }

  creatureName() {
    return this.t(this.creature.nameKey);
  }

  activeHuntAffix() {
    if (!this.selectedHuntAffixId) return null;
    return this.ownedHuntAffixes.find((affix) => affix.id === this.selectedHuntAffixId) ?? null;
  }

  setOwnedHuntAffixes(affixes) {
    this.ownedHuntAffixes = affixes;
    if (this.selectedHuntAffixId && !this.activeHuntAffix()) {
      this.selectedHuntAffixId = null;
    }
  }

  huntAffixName(affix) {
    return this.t(affix.nameKey);
  }

  objectiveLabel(objective) {
    return this.t(objective.labelKey);
  }

  creaturePerception() {
    const stats = {
      ...(this.creature.combat?.typeProfile?.stats ?? {}),
      ...(this.creature.combat?.stats ?? {})
    };
    return stats.perception ?? 0;
  }

  isObjectiveHidden(objective, completed = false) {
    if (!objective.hiddenUntilPerception || completed) return false;
    return (this.build.perception ?? 0) < this.creaturePerception();
  }

  openConditionsModal(completedObjectives = {}) {
    this.openModal("conditions", { completedObjectives });
  }

  setActiveBriefingButton(kind) {
    const { behaviorButton, captureConditionsButton } = this.nodes;
    const activeButtonByKind = {
      behavior: behaviorButton,
      conditions: captureConditionsButton
    };
    const activeButton = activeButtonByKind[kind] ?? null;

    [behaviorButton, captureConditionsButton].forEach((button) => {
      const isSelected = button === activeButton;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  openModal(kind, { completedObjectives = {} } = {}) {
    const { nodes, t, creature } = this;
    const name = this.creatureName();
    const isBehavior = kind === "behavior";
    const isConditions = kind === "conditions";
    const isAffix = kind === "affix";
    const isRewards = kind === "rewards";
    this.setActiveBriefingButton(kind);
    document.body.classList.toggle("capture-conditions-modal-open", isConditions);
    this.onModalStateChange({ open: true, kind });

    if (isConditions) {
      nodes.briefingModalTitle.textContent = t("ui.capture_conditions_title");
    } else if (isAffix) {
      nodes.briefingModalTitle.textContent = t("ui.affix_title");
    } else {
      nodes.briefingModalTitle.textContent = isBehavior
        ? t("ui.creature_behavior_title", { creature: name })
        : t("ui.creature_rewards_title", { creature: name });
    }

    nodes.briefingModalDescription.textContent = isBehavior
      ? t(creature.behaviorKey)
      : isAffix
        ? t("ui.hunt_affix_prompt")
        : t("ui.creature_rewards_empty");
    nodes.briefingModalDescription.hidden = !isBehavior && !isAffix;
    nodes.briefingModalObjectives.hidden = !isConditions && !isAffix && !isRewards;
    nodes.briefingModalObjectives.innerHTML = "";
    nodes.briefingModalObjectives.classList.remove("reward-list");

    if (isConditions) {
      this.objectives.forEach((objective) => {
        const completed = Boolean(completedObjectives[objective.id]);
        const hidden = this.isObjectiveHidden(objective, completed);
        const row = document.createElement("div");
        row.className = `objective${completed ? " done" : ""}${hidden ? " hidden" : ""}`;
        row.textContent = `${completed ? "✓" : hidden ? "?" : "•"} ${hidden ? t("objective.hidden.preview") : this.objectiveLabel(objective)}`;
        nodes.briefingModalObjectives.append(row);
      });
    } else if (isAffix) {
      this.renderHuntAffixList();
    } else if (isRewards) {
      this.renderRewardsList();
    }

    nodes.briefingModalShield.hidden = false;
    nodes.briefingModal.hidden = false;
  }

  renderRewardsList() {
    const { nodes, t } = this;
    const name = this.creatureName();
    const rewards = captureRewardPreview(this.creature);
    const instinctName = this.encounterAffix
      ? this.huntAffixName(this.encounterAffix)
      : t("ui.affix_empty_name");
    const instinctDescription = this.encounterAffix
      ? t(this.encounterAffix.descriptionKey)
      : t("ui.affix_empty");
    const rows = [
      {
        kind: "currency",
        title: t("reward.flee", { creature: name }),
        amount: rewards.flee
      },
      {
        kind: "currency",
        title: t("reward.capture", { creature: name }),
        amount: rewards.capture
      },
      {
        kind: "currency",
        title: t("reward.capture_three_objectives"),
        amount: rewards.captureThreeObjectives
      },
      {
        kind: "instinct",
        title: t("reward.capture_instinct_bonus", { creature: name }),
        affix: instinctName,
        description: instinctDescription,
        suffix: "!"
      },
      {
        title: t("reward.capture_perfect")
      }
    ];

    nodes.briefingModalObjectives.classList.add("reward-list");
    rows.forEach(({ kind, title, amount, affix, description, suffix = "" }) => {
      const row = document.createElement("div");
      row.className = `reward-row${kind === "currency" ? " centered" : ""}`;
      const titleNode = document.createElement("div");
      titleNode.className = "reward-title";
      titleNode.append(title);
      if (amount) {
        titleNode.append(" ", this.createRewardAmount(amount));
      }
      if (affix) {
        const affixNode = document.createElement("span");
        affixNode.className = "reward-affix-name";
        affixNode.textContent = affix;
        titleNode.append(" ", affixNode, suffix);
      }
      row.append(titleNode);

      if (description) {
        const descriptionNode = document.createElement("div");
        descriptionNode.className = "reward-description";
        descriptionNode.textContent = description;
        row.append(descriptionNode);
      }

      nodes.briefingModalObjectives.append(row);
    });
  }

  createRewardAmount({ stars, gold }) {
    const amountNode = document.createElement("div");
    amountNode.className = "reward-amount";
    amountNode.append(
      this.createRewardToken(stars, "assets/inventaire/XP.png", "XP"),
      this.createRewardToken(gold, "assets/inventaire/or.png", "Or")
    );
    return amountNode;
  }

  createRewardToken(value, iconSrc, label) {
    const token = document.createElement("span");
    token.className = "reward-token";
    const valueNode = document.createElement("span");
    valueNode.textContent = value;
    const icon = document.createElement("img");
    icon.src = iconSrc;
    icon.alt = label;
    token.append(valueNode, icon);
    return token;
  }

  renderHuntAffixList(scrollTop = 0) {
    renderInstinctList(this.nodes.briefingModalObjectives, {
      affixes: this.ownedHuntAffixes,
      selectedId: this.selectedHuntAffixId,
      t: this.t,
      emptyText: this.t("ui.hunt_affix_none_owned", { creature: this.creatureName() }),
      scrollTop,
      onChange: (newId, currentScrollTop) => {
        this.selectedHuntAffixId = newId;
        this.renderHuntAffixList(currentScrollTop);
      }
    });
  }

  closeModal() {
    const { nodes } = this;
    this.setActiveBriefingButton(null);
    document.body.classList.remove("capture-conditions-modal-open");
    this.onModalStateChange({ open: false, kind: null });
    nodes.briefingModal.hidden = true;
    nodes.briefingModalShield.hidden = true;
    nodes.briefingModalDescription.hidden = false;
    nodes.briefingModalObjectives.hidden = true;
    nodes.briefingModalObjectives.innerHTML = "";
  }
}
