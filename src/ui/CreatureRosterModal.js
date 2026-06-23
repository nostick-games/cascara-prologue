import { setPixelButtonLabel } from "./PixelButton.js";
import { applyCreatureIdleSprite } from "./creatureIdleSprite.js";
import { affixes } from "../data/affixes.js";
import { computeEquippedCreatureStats } from "../data/humanEnemies/inheritedStats.js";
import { statDefinitions } from "../data/stats.js";
import { huntAffixLevel } from "../game/affixEffects.js";
import { creatureInstinctLevel, creatureLevelProgress } from "../game/creatureProgression.js";

const rosterCellSpriteSize = 148;
const rosterPreviewSpriteSize = 480;
const statDefinitionById = Object.fromEntries(statDefinitions.map((stat) => [stat.id, stat]));
const affixById = Object.fromEntries(affixes.map((affix) => [affix.id, affix]));
const romanLevels = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const rosterTypeLabels = {
  utilitaire: "Util."
};
const sortOptions = [
  { id: "captureAsc", label: "Ancien" },
  { id: "captureDesc", label: "Récent" },
  { id: "nameAsc", label: "A > Z" },
  { id: "nameDesc", label: "Z > A" },
  { id: "typeAsc", label: "Type" },
  { id: "levelDesc", label: "Niveau" }
];

// Type dont l'équipe ne peut contenir qu'un seul exemplaire.
const uniquePerTeamType = "utilitaire";

export class CreatureRosterModal {
  constructor({
    t,
    getOwnedCreatures,
    getTeam,
    onConfirm,
    onSignature,
    getMountNode = () => document.querySelector(".app") ?? document.body
  }) {
    this.t = t;
    this.getOwnedCreatures = getOwnedCreatures;
    this.getTeam = getTeam;
    this.onConfirm = onConfirm;
    this.onSignature = onSignature;
    this.getMountNode = getMountNode;
    this.shield = this.createElement();
    this.grid = this.shield.querySelector(".roster-grid");
    this.okButton = this.shield.querySelector(".roster-ok");
    this.signatureButton = this.shield.querySelector(".roster-signature");
    this.previewSprite = this.shield.querySelector(".roster-preview-sprite");
    this.previewPrompt = this.shield.querySelector(".roster-preview-prompt");
    this.statsList = this.shield.querySelector(".roster-stats-list");
    this.nameBlock = this.shield.querySelector(".roster-name-block");
    this.typeBlock = this.shield.querySelector(".roster-type-block");
    this.levelBlock = this.shield.querySelector(".roster-level-block");
    this.sortControls = this.shield.querySelector(".roster-sort-controls");
    this.sortMode = "captureDesc";
    this.slotIndex = null;
    this.pendingSelection = null;
    this.browseOnly = false;

    this.okButton.addEventListener("click", () => this.confirm());
    this.signatureButton?.addEventListener("click", () => this.onSignature?.(this.draftTeam()));
    this.renderSortControls();
  }

  createElement() {
    const shield = document.createElement("div");
    shield.className = "roster-modal-shield";
    shield.hidden = true;
    shield.innerHTML = `
      <div class="roster-modal pixel-modal" role="dialog" aria-modal="true">
        <div class="inventory-corner inventory-top-left"></div>
        <div class="inventory-edge inventory-top"></div>
        <div class="inventory-corner inventory-top-right"></div>
        <div class="inventory-edge inventory-left"></div>
        <div class="roster-modal-content pixel-modal-content">
          <div class="roster-modal-layout">
            <aside class="roster-preview-column">
              <div class="roster-preview-window">
                <div class="roster-preview-sprite"></div>
                <div class="roster-preview-prompt"></div>
              </div>
              <div class="roster-name-block"></div>
              <div class="roster-meta-row">
                <div class="roster-meta-block roster-type-block"></div>
                <div class="roster-meta-block roster-level-block"></div>
              </div>
              <div class="roster-stats-window">
                <div class="roster-stats-list"></div>
              </div>
            </aside>
            <section class="roster-browser-window">
              <div class="roster-sort-controls"></div>
              <div class="roster-grid"></div>
              <div class="roster-footer-actions">
                <span></span>
                <button class="secondary roster-signature" type="button"></button>
                <button class="primary roster-ok" type="button"></button>
              </div>
            </section>
          </div>
        </div>
        <div class="inventory-edge inventory-right"></div>
        <div class="inventory-corner inventory-bottom-left"></div>
        <div class="inventory-edge inventory-bottom"></div>
        <div class="inventory-corner inventory-bottom-right"></div>
      </div>
    `;
    return shield;
  }

  open(slotIndex) {
    this.browseOnly = false;
    this.shield.classList.remove("is-browse-only");
    this.slotIndex = slotIndex;
    this.pendingSelection = this.getTeam()[slotIndex] ?? null;
    this.render();
    this.grid.scrollTop = 0;
    this.getMountNode()?.append(this.shield);
    this.shield.hidden = false;
    this.okButton.focus();
  }

  openBrowser() {
    this.browseOnly = true;
    this.shield.classList.add("is-browse-only");
    this.slotIndex = null;
    this.pendingSelection = null;
    this.render();
    this.grid.scrollTop = 0;
    this.getMountNode()?.append(this.shield);
    this.shield.hidden = false;
    this.okButton.focus();
  }

  close() {
    this.slotIndex = null;
    this.pendingSelection = null;
    this.browseOnly = false;
    this.shield.hidden = true;
    this.shield.classList.remove("is-browse-only");
  }

  confirm() {
    if (this.browseOnly || this.slotIndex === null) {
      this.close();
      return;
    }
    this.onConfirm(this.slotIndex, this.pendingSelection);
    this.close();
  }

  draftTeam() {
    if (this.browseOnly || this.slotIndex === null) return this.getTeam();
    return this.getTeam().map((entryId, index) => (index === this.slotIndex ? this.pendingSelection : entryId));
  }

  render() {
    this.shield.querySelector(".roster-modal")?.setAttribute("aria-label", this.t("ui.roster.title"));
    setPixelButtonLabel(this.okButton, this.t("ui.ok"));
    if (this.signatureButton) {
      this.signatureButton.hidden = this.browseOnly;
      setPixelButtonLabel(this.signatureButton, this.t("action.signature.name"));
    }
    this.syncSortControls();

    this.grid.innerHTML = "";
    const owned = this.sortedCreatures(this.getOwnedCreatures());
    if (owned.length === 0) {
      const empty = document.createElement("div");
      empty.className = "roster-empty";
      empty.textContent = this.t("ui.roster.empty");
      this.grid.append(empty);
      this.renderPreview(null);
      return;
    }

    const team = this.browseOnly ? [] : this.getTeam();
    // L'équipe ne peut contenir qu'un seul utilitaire : s'il y en a déjà un dans un AUTRE
    // slot, tous les utilitaires deviennent non sélectionnables (comme déjà équipés).
    const typeOfEntry = (entryId) => owned.find((o) => o.entry.id === entryId)?.creature?.type;
    const uniqueTypeTakenElsewhere = team.some(
      (id, index) => index !== this.slotIndex && typeOfEntry(id) === uniquePerTeamType
    );

    owned.forEach(({ entry, creature }) => {
      const inOtherSlot = !this.browseOnly
        && team.some((id, index) => id === entry.id && index !== this.slotIndex);
      const blockedByUniqueType =
        creature.type === uniquePerTeamType && uniqueTypeTakenElsewhere && !inOtherSlot;
      const locked = inOtherSlot || blockedByUniqueType;
      const selected = this.pendingSelection === entry.id;

      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `roster-cell${selected ? " selected" : ""}${locked ? " locked" : ""}`;
      cell.setAttribute("aria-label", this.t(creature.nameKey));
      cell.setAttribute("aria-pressed", selected ? "true" : "false");

      const sprite = document.createElement("div");
      sprite.className = "creature-idle-sprite";
      applyCreatureIdleSprite(sprite, {
        spriteUrl: creature.sprites?.briefing ?? creature.sprites?.combat,
        frameCountHint: creature.sprites?.frameCount,
        size: rosterCellSpriteSize
      });
      cell.append(sprite);

      if (locked) {
        cell.disabled = true;
      } else {
        cell.addEventListener("click", () => this.toggle(entry.id));
      }

      this.grid.append(cell);
    });

    const selectedCreature = this.selectedCreature();
    this.renderPreview(selectedCreature);
  }

  toggle(entryId) {
    this.pendingSelection = this.pendingSelection === entryId ? null : entryId;
    this.render();
  }

  selectedCreature() {
    if (!this.pendingSelection) return null;
    return this.getOwnedCreatures().find(({ entry }) => entry.id === this.pendingSelection) ?? null;
  }

  renderSortControls() {
    if (!this.sortControls) return;
    this.sortControls.setAttribute("aria-label", this.t("ui.roster.sort_options"));
    this.sortControls.innerHTML = "";
    sortOptions.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary roster-sort-button";
      button.dataset.sortMode = option.id;
      setPixelButtonLabel(button, option.label);
      button.addEventListener("click", () => {
        this.sortMode = option.id;
        this.grid.scrollTop = 0;
        this.render();
      });
      this.sortControls.append(button);
    });
    this.syncSortControls();
  }

  syncSortControls() {
    if (!this.sortControls) return;
    this.sortControls.setAttribute("aria-label", this.t("ui.roster.sort_options"));
    this.sortControls.querySelectorAll(".roster-sort-button").forEach((button) => {
      const selected = button.dataset.sortMode === this.sortMode;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  creatureName(creature) {
    return this.t(creature.nameKey);
  }

  creatureTypeLabel(creature) {
    return rosterTypeLabels[creature.type] ?? this.t(`affix.type.${creature.type}`);
  }

  sortedCreatures(creatures) {
    const byName = (a, b) => this.creatureName(a.creature).localeCompare(this.creatureName(b.creature));
    const byCaptureAsc = (a, b) => (a.entry.capturedAt ?? 0) - (b.entry.capturedAt ?? 0);
    const byCaptureDesc = (a, b) => (b.entry.capturedAt ?? 0) - (a.entry.capturedAt ?? 0);
    const byType = (a, b) => {
      const type = this.creatureTypeLabel(a.creature).localeCompare(this.creatureTypeLabel(b.creature));
      return type || byName(a, b) || byCaptureDesc(a, b);
    };
    const byLevelDesc = (a, b) => {
      const level = (b.entry.level ?? 1) - (a.entry.level ?? 1);
      return level || byName(a, b) || byCaptureDesc(a, b);
    };
    const comparators = {
      captureAsc: byCaptureAsc,
      captureDesc: byCaptureDesc,
      nameAsc: byName,
      nameDesc: (a, b) => byName(b, a),
      typeAsc: byType,
      levelDesc: byLevelDesc
    };

    return [...creatures].sort(comparators[this.sortMode] ?? byCaptureDesc);
  }

  formatStatValue(stat, value) {
    return `${value}${stat?.suffix ?? ""}`;
  }

  formatLevel(level = 1) {
    return `n.${romanLevels[level] ?? level}`;
  }

  instinctForSelection(entry, creature) {
    return affixById[entry.affixId]
      ?? affixes.find((affix) => affix.sourceCreature === creature.id)
      ?? null;
  }

  renderPreview(selection) {
    if (!this.previewSprite || !this.statsList) return;

    this.previewSprite.innerHTML = "";
    this.statsList.innerHTML = "";

    if (this.previewPrompt) {
      this.previewPrompt.textContent = this.t("ui.roster.select_prompt");
      this.previewPrompt.hidden = Boolean(selection);
    }

    if (!selection) {
      this.previewSprite.classList.add("empty");
      this.statsList.classList.add("empty");
      this.statsList.textContent = "";
      if (this.nameBlock) this.nameBlock.textContent = "-";
      if (this.typeBlock) this.typeBlock.textContent = "-";
      if (this.levelBlock) this.levelBlock.textContent = "-";
      return;
    }

    this.previewSprite.classList.remove("empty");
    this.statsList.classList.remove("empty");

    const { entry, creature } = selection;
    if (this.nameBlock) this.nameBlock.textContent = this.creatureName(creature);
    if (this.typeBlock) {
      this.typeBlock.textContent = rosterTypeLabels[creature.type] ?? this.t(`affix.type.${creature.type}`);
    }
    if (this.levelBlock) this.levelBlock.textContent = this.formatLevel(entry.level ?? 1);

    applyCreatureIdleSprite(this.previewSprite, {
      spriteUrl: creature.sprites?.briefing ?? creature.sprites?.combat,
      frameCountHint: creature.sprites?.frameCount,
      size: rosterPreviewSpriteSize
    });

    const { total } = computeEquippedCreatureStats([
      { creatureId: entry.creatureId, level: entry.level ?? 1 }
    ]);
    Object.entries(total)
      .filter(([, value]) => value > 0)
      .forEach(([statId, value]) => {
        const stat = statDefinitionById[statId];
        const row = document.createElement("div");
        row.className = "roster-stat-row";
        row.textContent = `${this.t(stat?.nameKey ?? statId)} +${this.formatStatValue(stat, value)}`;
        this.statsList.append(row);
      });

    const instinct = this.instinctForSelection(entry, creature);
    const instinctBlock = document.createElement("div");
    instinctBlock.className = "roster-instinct-block";

    const instinctTitle = document.createElement("div");
    instinctTitle.className = "roster-instinct-title";
    instinctTitle.textContent = instinct
      ? `${this.t(instinct.nameKey)}, ${huntAffixLevel(this.t, {
          ...instinct,
          level: creatureInstinctLevel(entry)
        })}`
      : this.t("ui.affix");
    instinctBlock.append(instinctTitle);

    const instinctDescription = document.createElement("div");
    instinctDescription.className = "roster-instinct-description";
    instinctDescription.textContent = instinct
      ? this.t(instinct.descriptionKey)
      : this.t("ui.roster.no_instinct");
    instinctBlock.append(instinctDescription);

    this.statsList.append(instinctBlock);

    const progress = creatureLevelProgress(entry);
    const progressBlock = document.createElement("div");
    progressBlock.className = "roster-instinct-block";

    const progressTitle = document.createElement("div");
    progressTitle.className = "roster-instinct-title";
    progressTitle.textContent = this.t("ui.roster.level_progress_title");
    progressBlock.append(progressTitle);

    const progressDescription = document.createElement("div");
    progressDescription.className = "roster-instinct-description";
    progressDescription.textContent = progress.maxed
      ? this.t("ui.roster.level_progress_max")
      : this.t("ui.roster.level_progress_counter", {
          wins: progress.wins,
          required: progress.required
        });
    progressBlock.append(progressDescription);
    this.statsList.append(progressBlock);

    if (!this.statsList.children.length) {
      this.statsList.classList.add("empty");
      this.statsList.textContent = this.t("ui.roster.no_stats");
    }
  }
}
