import { StatRadar } from "../ui/StatRadar.js";
import { setPixelButtonLabel } from "../ui/PixelButton.js";
import { CreatureRosterModal } from "../ui/CreatureRosterModal.js";
import { InstinctModal } from "../ui/InstinctModal.js";
import { applyCreatureIdleSprite } from "../ui/creatureIdleSprite.js";
import { computeEquippedCreatureStats } from "../data/humanEnemies/inheritedStats.js";
import { dominantHumanBuildType } from "../data/humanEnemies/humanBuildTypes.js";
import { affixes } from "../data/affixes.js";
import { creatures } from "../data/creatures.js";
import { createHumanSignatureFromEquippedCreatures, translatedSignatureName } from "../game/humanSignatures.js";
import { creatureInstinctLevel } from "../game/creatureProgression.js";

const affixById = Object.fromEntries(affixes.map((affix) => [affix.id, affix]));
const creaturesById = Object.fromEntries(Object.values(creatures).map((creature) => [creature.id, creature]));
const enemyTeamSlotCount = 3;
const enemyTeamSpriteSize = 124;
const enemyTeamModalSpriteSize = 400;
const maxAffixLevel = 2;
const rosterSlotSpriteSize = 180;
const defaultHumanSpriteFrameCount = 5;
const defaultHumanSpriteFrameSize = 32;

// Couleurs de pulsation du radar selon le type dominant (≥ 2 créatures du même type).
const dominantTypePulseColors = {
  feu: [245, 200, 75],   // jaune
  eau: [74, 144, 217],   // bleu
  vent: [126, 217, 138]  // vert clair
};
const humanBriefingSpriteScales = {
  desktop: 6,
  mobile: 5
};
const humanBriefingSpriteOffset = {
  desktop: { x: 34, y: 74 },
  mobile: {}
};
const enemyRadarStatMap = {
  power: "power",
  defense: "defense",
  vitality: "maxHp",
  crit: "crit",
  pa: "maxPa",
  speed: "speed",
  perception: "perception"
};
const signatureEffectKeyById = {
  feu_simple: "signature.effect.feu_simple",
  eau_simple: "signature.effect.eau_simple",
  vent_simple: "signature.effect.vent_simple",
  utilitaire_simple: "signature.effect.utilitaire_simple",
  feu_renforcee: "signature.effect.feu_renforcee",
  eau_renforcee: "signature.effect.eau_renforcee",
  vent_renforcee: "signature.effect.vent_renforcee",
  feu_eau: "signature.effect.feu_eau",
  feu_vent: "signature.effect.feu_vent",
  eau_vent: "signature.effect.eau_vent",
  feu_tactique: "signature.effect.feu_tactique",
  eau_tactique: "signature.effect.eau_tactique",
  vent_tactique: "signature.effect.vent_tactique",
  triade_instable: "signature.effect.triade_instable",
  alchimie_de_guerre: "signature.effect.alchimie_de_guerre",
  assaut_fulgurant: "signature.effect.assaut_fulgurant",
  verrou_mouvant: "signature.effect.verrou_mouvant"
};
const signatureChargeKeyByKind = {
  fire: "signature.charge.fire",
  water: "signature.charge.water",
  wind: "signature.charge.wind",
  utility: "signature.charge.utility",
  fireWater: "signature.charge.hybrid",
  fireWind: "signature.charge.hybrid",
  waterWind: "signature.charge.hybrid",
  fireTactical: "signature.charge.tactical",
  waterTactical: "signature.charge.tactical",
  windTactical: "signature.charge.tactical",
  triade: "signature.charge.triade",
  alchemy: "signature.charge.hybrid",
  assault: "signature.charge.hybrid",
  lock: "signature.charge.hybrid"
};

export class HumanBriefingScreen {
  constructor({
    nodes,
    t,
    enemy,
    encounterIntroKey,
    stats,
    build,
    initialBuild,
    resetBuild,
    totalPoints,
    enemyAdapter = null,
    isLocked,
    onChange,
    onReset,
    onStart,
    getOwnedCreatures
  }) {
    this.nodes = nodes;
    this.t = t;
    this.enemy = enemy;
    this.baseEnemy = enemy;
    this.encounterIntroKey = encounterIntroKey;
    this.enemyAdapter = enemyAdapter;
    this.isLocked = isLocked;
    this.onReset = onReset;
    this.onStart = onStart;
    this.getOwnedCreatures = getOwnedCreatures ?? (() => []);
    this.team = [null, null, null];
    this.selectedAffixId = null;

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

    this.rosterModal = new CreatureRosterModal({
      t,
      getOwnedCreatures: () => this.getOwnedCreatures(),
      getTeam: () => this.team,
      onConfirm: (slotIndex, entryId) => this.assignTeamSlot(slotIndex, entryId),
      onSignature: (team) => this.openSignatureModal(team)
    });

    nodes.rosterSlots.forEach((button, slotIndex) => {
      button.addEventListener("click", () => {
        if (this.isLocked()) return;
        this.rosterModal.open(slotIndex);
      });
    });

    this.instinctModal = new InstinctModal({
      shield: nodes.instinctModalShield,
      modal: nodes.instinctModal,
      title: nodes.instinctModalTitle,
      prompt: nodes.instinctModalPrompt,
      list: nodes.instinctModalList,
      closeButton: nodes.instinctModalClose,
      t,
      promptKey: "ui.instinct_prompt",
      getAffixes: () => this.teamInstincts(),
      getSelectedId: () => this.selectedAffixId,
      onSelect: (id) => { this.selectedAffixId = id; },
      getEmptyText: () => this.t("ui.instinct_team_empty")
    });

    nodes.instinctButton.addEventListener("click", () => {
      if (this.isLocked()) return;
      this.instinctModal.open();
    });

    nodes.enemyRadarButton.addEventListener("click", () => {
      if (this.isLocked()) return;
      this.openEnemyRadarModal();
    });
    nodes.enemyRadarModalClose.addEventListener("click", () => this.closeEnemyRadarModal());
    nodes.enemyRadarModalShield.addEventListener("click", () => this.closeEnemyRadarModal());
    nodes.enemyTeamModalClose.addEventListener("click", () => this.closeEnemyTeamModal());
    nodes.enemyTeamModalShield.addEventListener("click", () => this.closeEnemyTeamModal());

    nodes.resetBuildButton.addEventListener("click", () => {
      if (!this.canResetBuild()) return;
      this.onReset();
    });

    nodes.startCombatButton.addEventListener("click", () => {
      if (this.isLocked()) return;
      this.onStart();
    });
  }

  assignTeamSlot(slotIndex, entryId) {
    // Une créature ne peut occuper qu'un seul slot à la fois.
    this.team = this.team.map((id, index) => (id === entryId && index !== slotIndex ? null : id));
    this.team[slotIndex] = entryId;
    this.updateCreatureBonus();
    this.updateBuildType();
    this.updateAdaptiveEnemy();
    this.syncSelectedInstinct();
    this.render();
  }

  saveState() {
    return {
      team: [...this.team],
      selectedAffixId: this.selectedAffixId
    };
  }

  restoreState(state = {}) {
    this.team = Array.isArray(state.team)
      ? [state.team[0] ?? null, state.team[1] ?? null, state.team[2] ?? null]
      : [null, null, null];
    this.selectedAffixId = state.selectedAffixId ?? null;
    this.updateCreatureBonus();
    this.updateBuildType();
    this.updateAdaptiveEnemy();
    this.syncSelectedInstinct();
    this.render();
  }

  openOwnedCreatures() {
    this.rosterModal.openBrowser();
  }

  // Instincts disponibles = ceux des créatures équipées, avec le niveau obtenu
  // à la capture + les niveaux gagnés par la créature, plafonné à III.
  teamInstincts() {
    const owned = this.getOwnedCreatures();
    const byAffixId = new Map();
    this.team.filter(Boolean).forEach((entryId) => {
      const match = owned.find(({ entry }) => entry.id === entryId);
      const baseAffix = match ? affixById[match.entry.affixId] : null;
      if (!baseAffix) return;
      const level = Math.min(maxAffixLevel, creatureInstinctLevel(match.entry));
      const existing = byAffixId.get(baseAffix.id);
      if (!existing || level > existing.level) {
        byAffixId.set(baseAffix.id, { ...baseAffix, level });
      }
    });
    return [...byAffixId.values()];
  }

  activeInstinct() {
    if (!this.selectedAffixId) return null;
    return this.teamInstincts().find((affix) => affix.id === this.selectedAffixId) ?? null;
  }

  activeSignature(team = this.team) {
    return createHumanSignatureFromEquippedCreatures(this.equippedCreatures(team));
  }

  // Annule la sélection si l'instinct choisi n'est plus fourni par l'équipe.
  syncSelectedInstinct() {
    if (!this.selectedAffixId) return;
    const available = this.teamInstincts().some((affix) => affix.id === this.selectedAffixId);
    if (!available) this.selectedAffixId = null;
  }

  // Détermine le type dominant (≥ 2 créatures du même type) : il devient le type du build,
  // et fait pulser l'intérieur du radar avec sa couleur.
  updateBuildType() {
    const { sources } = computeEquippedCreatureStats(this.equippedCreatures());
    this.buildTypeProfile = dominantHumanBuildType(sources);
    this.dominantType = this.buildTypeProfile?.id ?? null;
    this.buildTypeRank = this.buildTypeProfile?.rank ?? null;
    this.radar.setPulseColor(this.dominantType ? dominantTypePulseColors[this.dominantType] ?? null : null);
  }

  equippedCreatures(team = this.team) {
    const owned = this.getOwnedCreatures();
    return team
      .filter(Boolean)
      .map((entryId) => owned.find(({ entry }) => entry.id === entryId))
      .filter(Boolean)
      .map(({ entry, creature }) => ({
        entryId: entry.id,
        creatureId: entry.creatureId,
        level: entry.level ?? 1,
        type: creature.type
      }));
  }

  // Agrège les stats héritables des créatures équipées et les pousse en bonus du radar.
  updateCreatureBonus() {
    const { total, sources } = computeEquippedCreatureStats(this.equippedCreatures());
    const buildTypeProfile = dominantHumanBuildType(sources);
    const specializationBonus = buildTypeProfile?.statBonus ?? {};
    this.radar.setBonus(Object.fromEntries(
      Object.keys(total).map((statId) => [
        statId,
        (total[statId] ?? 0) + (specializationBonus[statId] ?? 0)
      ])
    ));
  }

  combatBuild() {
    this.updateCreatureBonus();
    this.updateBuildType();
    return {
      ...this.radar.computeEffectiveBuild(),
      type: this.dominantType,
      typeRank: this.buildTypeRank,
      equippedCreatures: this.equippedCreatures()
    };
  }

  equippedCreatureCount() {
    return this.team.filter(Boolean).length;
  }

  ownedCreatureCount() {
    return this.getOwnedCreatures().length;
  }

  renderRosterSlots() {
    const owned = this.getOwnedCreatures();
    this.nodes.rosterSlots.forEach((button, slotIndex) => {
      const entryId = this.team[slotIndex];
      const match = entryId ? owned.find(({ entry }) => entry.id === entryId) : null;
      button.disabled = this.isLocked();
      button.classList.toggle("filled", Boolean(match));
      button.innerHTML = "";

      if (match) {
        const sprite = document.createElement("div");
        sprite.className = "creature-idle-sprite";
        applyCreatureIdleSprite(sprite, {
          spriteUrl: match.creature.sprites?.briefing ?? match.creature.sprites?.combat,
          frameCountHint: match.creature.sprites?.frameCount,
          size: rosterSlotSpriteSize
        });
        button.append(sprite);
        button.setAttribute("aria-label", this.t(match.creature.nameKey));
      } else {
        button.setAttribute("aria-label", this.t("ui.roster.slot_empty"));
      }
    });
  }

  configureEncounter({ enemy, encounterIntroKey, totalPoints, enemyAdapter = this.enemyAdapter }) {
    this.enemy = enemy;
    this.baseEnemy = enemy;
    this.encounterIntroKey = encounterIntroKey;
    this.enemyAdapter = enemyAdapter;
    this.radar.setTotalPoints(totalPoints);
    this.updateCreatureBonus();
    this.updateBuildType();
    this.updateAdaptiveEnemy();
  }

  updateAdaptiveEnemy() {
    if (!this.enemyAdapter) return;
    this.enemy = this.enemyAdapter({
      baseEnemy: this.baseEnemy,
      playerBuild: this.combatBuild(),
      playerBuildType: this.dominantType,
      playerTeam: this.equippedCreatures()
    }) ?? this.baseEnemy;
  }

  render() {
    this.updateCreatureBonus();
    this.updateBuildType();
    this.updateAdaptiveEnemy();
    this.renderStaticText();
    this.renderOpponent();
    this.renderStats();
    this.renderRosterSlots();
  }

  playRadarIntro() {
    this.radar.playIntro();
  }

  renderStaticText() {
    const { nodes, t } = this;
    nodes.radarCanvas.setAttribute("aria-label", t("ui.radar.title"));
    setPixelButtonLabel(nodes.radarModalClose, t("ui.ok"));
    setPixelButtonLabel(nodes.resetBuildButton, "♺");
    nodes.resetBuildButton.setAttribute("aria-label", t("ui.reset"));
    nodes.resetBuildButton.title = t("ui.reset");
    setPixelButtonLabel(nodes.enemyRadarButton, t("ui.enemy_radar"));
    setPixelButtonLabel(nodes.enemyRadarModalClose, t("ui.ok"));
    setPixelButtonLabel(nodes.enemyTeamModalClose, t("ui.ok"));
    setPixelButtonLabel(nodes.instinctButton, t("ui.affix"));
    setPixelButtonLabel(nodes.startCombatButton, t("ui.combat"), { variant: "combat" });
  }

  renderStats() {
    const { nodes } = this;
    nodes.pointsLeft.textContent = this.radar.pointsLeft();
    nodes.pointsUnit.innerHTML = `<img src="assets/inventaire/gemme.png" alt="XP" class="points-icon">`;
    nodes.resetBuildButton.disabled = !this.canResetBuild();
    nodes.enemyRadarButton.disabled = this.isLocked();
    nodes.startCombatButton.disabled = this.isLocked();
    nodes.instinctButton.disabled = this.isLocked();
    this.radar.render();
  }

  canResetBuild() {
    return !this.isLocked() && this.radar.resettableSpentPoints() > 0;
  }

  renderOpponent() {
    const { nodes, t, enemy } = this;
    const opponent = this.opponentName();
    nodes.stage.setAttribute("aria-label", t(enemy.stageLabelKey));
    nodes.sprite.setAttribute("aria-label", t(enemy.spriteLabelKey));
    nodes.sprite.style.backgroundImage = `url("${enemy.sprites.briefing}")`;
    this.applySpriteLayout(enemy.sprites);
    nodes.encounterSentence.innerHTML = t(this.encounterIntroKey, {
      opponent: `<span class="creature-inline">${opponent}</span>`
    });
    this.renderEnemyTeam();
  }

  // Blocs de l'équipe de l'adversaire : sprite des créatures équipées, sinon « ❌ ».
  renderEnemyTeam() {
    const container = this.nodes.enemyTeamSlots;
    if (!container) return;
    container.innerHTML = "";
    const equipped = this.enemy?.equippedCreatures ?? [];
    for (let index = 0; index < enemyTeamSlotCount; index += 1) {
      const entry = equipped[index];
      const creature = entry ? creaturesById[entry.creatureId] : null;
      const slot = document.createElement("button");
      slot.className = "enemy-team-slot";
      slot.type = "button";
      slot.addEventListener("click", () => this.openEnemyTeamModal());

      if (creature) {
        const sprite = document.createElement("div");
        sprite.className = "creature-idle-sprite";
        applyCreatureIdleSprite(sprite, {
          spriteUrl: creature.sprites?.briefing ?? creature.sprites?.combat,
          frameCountHint: creature.sprites?.frameCount,
          size: enemyTeamSpriteSize
        });
        slot.append(sprite);
        slot.setAttribute("aria-label", this.t(creature.nameKey));
      } else {
        slot.classList.add("empty");
        slot.textContent = "❌";
        slot.setAttribute("aria-label", this.t("ui.roster.slot_empty"));
      }

      container.append(slot);
    }
  }

  openEnemyTeamModal() {
    const { nodes, t } = this;
    const opponent = this.opponentName();
    nodes.enemyTeamModalTitle.textContent = t("ui.enemy_team_title", { opponent });
    nodes.enemyTeamModalList.innerHTML = "";
    this.enemyTeamCreatures().forEach((creature) => {
      const item = document.createElement("div");
      item.className = "enemy-team-modal-item";

      const sprite = document.createElement("div");
      sprite.className = "creature-idle-sprite";
      applyCreatureIdleSprite(sprite, {
        spriteUrl: creature.sprites?.briefing ?? creature.sprites?.combat,
        frameCountHint: creature.sprites?.frameCount,
        size: enemyTeamModalSpriteSize
      });

      const name = document.createElement("div");
      name.className = "enemy-team-modal-name";
      name.textContent = t(creature.nameKey);

      item.append(sprite, name);
      nodes.enemyTeamModalList.append(item);
    });
    nodes.enemyTeamModalShield.hidden = false;
    nodes.enemyTeamModal.hidden = false;
  }

  closeEnemyTeamModal() {
    this.nodes.enemyTeamModal.hidden = true;
    this.nodes.enemyTeamModalShield.hidden = true;
  }

  openSignatureModal(team = this.team) {
    const { nodes, t } = this;
    const signature = this.activeSignature(team);
    setPixelButtonLabel(nodes.instinctModalClose, t("ui.ok"));
    nodes.instinctModalList.innerHTML = "";
    nodes.instinctModalList.classList.add("signature-plain-list");

    if (!signature) {
      nodes.instinctModalTitle.textContent = t("ui.signature_title");
      nodes.instinctModalPrompt.textContent = t("ui.signature_team_empty");
      const empty = document.createElement("div");
      empty.className = "objective hidden";
      empty.textContent = t("ui.signature_empty_hint");
      nodes.instinctModalList.append(empty);
    } else {
      nodes.instinctModalTitle.textContent = translatedSignatureName(t, signature);
      nodes.instinctModalPrompt.textContent = this.signaturePromptText(team);
      this.appendSignatureModalRow(t("ui.signature_composition"), this.signatureCompositionText(team));
      this.appendSignatureModalRow(t("ui.signature_effect"), t(signatureEffectKeyById[signature.id] ?? "signature.effect.generic"));
      this.appendSignatureModalRow(t("ui.signature_charge_rule"), t(signatureChargeKeyByKind[signature.kind] ?? "signature.charge.generic"));
      const note = document.createElement("p");
      note.className = "signature-modal-note";
      note.textContent = t("ui.signature_final_note");
      nodes.instinctModalList.append(note);
    }

    nodes.instinctModalShield.hidden = false;
    nodes.instinctModal.hidden = false;
    this.resetSignatureModalScroll();
  }

  appendSignatureModalRow(label, value) {
    const row = document.createElement("section");
    row.className = "signature-info-row";
    const title = document.createElement("strong");
    title.textContent = `${label} :`;
    const description = document.createElement("p");
    description.textContent = value;
    row.append(title, description);
    this.nodes.instinctModalList.append(row);
  }

  signatureCompositionText(team = this.team) {
    const types = this.equippedCreatures(team).map((entry) => this.t(`affix.type.${entry.type}`));
    return types.length ? types.join(" + ") : this.t("ui.signature_no_composition");
  }

  signaturePromptText(team = this.team) {
    const names = this.equippedCreatures(team)
      .map((entry) => this.t(creaturesById[entry.creatureId]?.nameKey ?? entry.creatureId));
    if (names.length === 1) return this.t("ui.signature_prompt_one", { first: names[0] });
    if (names.length === 2) return this.t("ui.signature_prompt_two", { first: names[0], second: names[1] });
    return this.t("ui.signature_prompt_three", { first: names[0], second: names[1], third: names[2] });
  }

  resetSignatureModalScroll() {
    const { nodes } = this;
    const reset = () => {
      nodes.instinctModalList.scrollTop = 0;
      nodes.instinctModal.scrollTop = 0;
      nodes.instinctModal.querySelector(".pixel-modal-content")?.scrollTo?.({ top: 0 });
    };
    reset();
    requestAnimationFrame(reset);
  }

  enemyTeamCreatures() {
    return (this.enemy?.equippedCreatures ?? [])
      .map((entry) => creaturesById[entry.creatureId])
      .filter(Boolean);
  }

  applySpriteLayout(sprites = {}) {
    const frameCount = sprites.frameCount ?? defaultHumanSpriteFrameCount;
    const frameWidth = sprites.frameWidth ?? defaultHumanSpriteFrameSize;
    const frameHeight = sprites.frameHeight ?? defaultHumanSpriteFrameSize;
    const desktopScale = sprites.briefingScale?.desktop ?? humanBriefingSpriteScales.desktop;
    const mobileScale = sprites.briefingScale?.mobile ?? humanBriefingSpriteScales.mobile;
    const desktopOffset = sprites.briefingOffset?.desktop ?? humanBriefingSpriteOffset.desktop;
    const mobileOffset = sprites.briefingOffset?.mobile ?? humanBriefingSpriteOffset.mobile;
    const desktop = this.createSpriteLayout(frameWidth, frameHeight, frameCount, desktopScale);
    const mobile = this.createSpriteLayout(frameWidth, frameHeight, frameCount, mobileScale);
    const sprite = this.nodes.sprite;
    const values = {
      "--human-sprite-width": desktop.width,
      "--human-sprite-height": desktop.height,
      "--human-sprite-background-size": desktop.backgroundSize,
      "--human-sprite-offset": desktop.animationOffset,
      "--human-sprite-transform": desktopOffset.transform ?? `translate(${desktopOffset.x}px, ${desktopOffset.y}px) translateZ(0)`,
      "--human-sprite-mobile-width": mobile.width,
      "--human-sprite-mobile-height": mobile.height,
      "--human-sprite-mobile-background-size": mobile.backgroundSize,
      "--human-sprite-mobile-offset": mobile.animationOffset,
      "--human-sprite-mobile-left": mobileOffset.left,
      "--human-sprite-mobile-top": mobileOffset.top,
      "--human-sprite-mobile-transform": mobileOffset.transform,
      "--human-sprite-steps": frameCount
    };

    Object.entries(values).forEach(([property, value]) => {
      if (value === undefined) sprite.style.removeProperty(property);
      else sprite.style.setProperty(property, value);
    });
  }

  createSpriteLayout(frameWidth, frameHeight, frameCount, scale) {
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

  opponentName() {
    // typeNameKey : libellé d'archétype affiché, découplé du type qui pilote les stats
    // (permet d'échanger les kits de combat sans changer le nom de classe montré au joueur).
    const typeNameKey = this.enemy.typeNameKey ?? this.enemy.typeProfile.nameKey;
    return `${this.t(typeNameKey)} ${this.t(this.enemy.nameKey)}`;
  }

  enemyRadarBuild() {
    const source = this.enemy.combat?.scaledStats ?? this.enemy.combat?.stats ?? {};
    return Object.fromEntries(this.radar.stats.map((stat) => [
      stat.id,
      source[enemyRadarStatMap[stat.id] ?? stat.id] ?? stat.min
    ]));
  }

  hasPreciseEnemyRadar(enemyBuild = this.enemyRadarBuild()) {
    const playerPerception = this.combatBuild().perception ?? 0;
    const enemyPerception = enemyBuild.perception ?? 0;
    return playerPerception > enemyPerception;
  }

  openEnemyRadarModal() {
    const { nodes, t } = this;
    const enemyBuild = this.enemyRadarBuild();
    const precise = this.hasPreciseEnemyRadar(enemyBuild);
    nodes.enemyRadarButton.blur();
    nodes.enemyRadarModalTitle.textContent = t("ui.enemy_radar_title", { opponent: this.opponentName() });
    nodes.enemyRadarModalDescription.textContent = t(precise ? "ui.enemy_radar_precise" : "ui.enemy_radar_blurry", {
      opponent: this.opponentName()
    });
    nodes.enemyRadarCanvas.classList.toggle("is-blurry", !precise);
    this.drawEnemyRadar(enemyBuild);
    nodes.enemyRadarModalShield.hidden = false;
    nodes.enemyRadarModal.hidden = false;
  }

  closeEnemyRadarModal() {
    this.nodes.enemyRadarModal.hidden = true;
    this.nodes.enemyRadarModalShield.hidden = true;
    this.nodes.enemyRadarButton.blur();
  }

  drawEnemyRadar(build) {
    const canvas = this.nodes.enemyRadarCanvas;
    const ctx = canvas.getContext("2d");
    const stats = this.radar.stats;
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height * 0.48;
    const radius = width * 0.28;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineWidth = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let ring = 1; ring <= 5; ring += 1) {
      const ringRadius = radius * (ring / 5);
      ctx.beginPath();
      stats.forEach((stat, index) => {
        const angle = (-Math.PI / 2) + (index / stats.length) * Math.PI * 2;
        const x = Math.cos(angle) * ringRadius;
        const y = Math.sin(angle) * ringRadius;
        index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = ring === 5 ? "rgba(241,198,106,0.46)" : "rgba(255,255,255,0.15)";
      ctx.stroke();
    }

    stats.forEach((stat, index) => {
      const angle = (-Math.PI / 2) + (index / stats.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.stroke();
    });

    const points = stats.map((stat, index) => {
      const range = stat.max - stat.min;
      const normalized = range <= 0 ? 0 : Math.min(1, Math.max(0, ((build[stat.id] ?? stat.min) - stat.min) / range));
      const angle = (-Math.PI / 2) + (index / stats.length) * Math.PI * 2;
      return {
        x: Math.cos(angle) * radius * (0.22 + normalized * 0.78),
        y: Math.sin(angle) * radius * (0.22 + normalized * 0.78),
        color: stat.color
      };
    });

    ctx.beginPath();
    points.forEach((point, index) => {
      index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(235,103,93,0.2)";
    ctx.strokeStyle = "rgba(241,198,106,0.9)";
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(17,18,24,0.78)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(point.x, point.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = point.color;
      ctx.fill();
      ctx.strokeStyle = "#111218";
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    ctx.restore();
  }
}
