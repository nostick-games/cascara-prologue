import { creatures } from "../data/creatures.js";
import { inheritedStatsForCreature } from "../data/humanEnemies/inheritedStats.js";
import { statDefinitions } from "../data/stats.js";
import { applyCreatureIdleSprite } from "./creatureIdleSprite.js";

const inheritableStatIds = ["power", "defense", "vitality", "crit", "speed"];
const spriteSize = 192;
const romanLevels = {
  1: "I",
  2: "II",
  3: "III"
};

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function nextFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

export class CreatureLevelUpSequence {
  constructor({ t, container = document.body, contained = false }) {
    this.t = t;
    this.container = container;
    this.contained = contained;
    this.nodes = null;
  }

  ensureNodes() {
    if (this.nodes) return this.nodes;

    const overlay = document.createElement("div");
    overlay.className = "creature-level-up-overlay";
    overlay.classList.toggle("is-contained", this.contained);
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="creature-level-up-stage">
        <div class="creature-level-up-burst" aria-hidden="true"></div>
        <div class="creature-level-up-ring" aria-hidden="true"></div>
        <div class="creature-level-up-shards" aria-hidden="true"></div>
        <div class="creature-level-up-orbit">
          <div class="creature-level-up-sprite" role="img"></div>
        </div>
        <div class="creature-level-up-stats" hidden>
          <h2></h2>
          <div class="creature-level-up-stat-list"></div>
        </div>
      </div>
      <div class="map-dialog-frame creature-level-up-dialog" hidden>
        <div class="map-dialog-log"></div>
      </div>
    `;
    this.container.append(overlay);

    this.nodes = {
      overlay,
      orbit: overlay.querySelector(".creature-level-up-orbit"),
      sprite: overlay.querySelector(".creature-level-up-sprite"),
      stats: overlay.querySelector(".creature-level-up-stats"),
      statsTitle: overlay.querySelector(".creature-level-up-stats h2"),
      statList: overlay.querySelector(".creature-level-up-stat-list"),
      dialog: overlay.querySelector(".creature-level-up-dialog"),
      dialogLog: overlay.querySelector(".creature-level-up-dialog .map-dialog-log")
    };
    return this.nodes;
  }

  async play(levelUps = []) {
    const pending = (Array.isArray(levelUps) ? levelUps : []).filter((levelUp) => creatures[levelUp.creatureId]);
    if (!pending.length) return;

    for (const levelUp of pending) {
      await this.playOne(levelUp);
    }
  }

  async playOne(levelUp) {
    const nodes = this.ensureNodes();
    const creature = creatures[levelUp.creatureId];
    const creatureName = levelUp.name ?? this.t(creature.nameKey);
    const previousLevel = levelUp.previousLevel ?? Math.max(1, (levelUp.level ?? 2) - 1);
    const nextLevel = levelUp.level ?? previousLevel + 1;

    this.reset();
    nodes.overlay.hidden = false;
    nodes.sprite.setAttribute("aria-label", this.t(creature.spriteLabelKey));
    applyCreatureIdleSprite(nodes.sprite, {
      spriteUrl: creature.sprites?.briefing ?? creature.sprites?.combat,
      frameCountHint: creature.sprites?.frameCount,
      size: spriteSize
    });
    await nextFrame();
    nodes.orbit.classList.add("is-swirling");
    nodes.sprite.classList.add("is-swirling");
    await wait(3050);

    await this.showDialog(this.t("creature_level.evolves", { creature: creatureName }));
    await this.showDialog(this.t("creature_level.level_up", {
      creature: creatureName,
      from: romanLevels[previousLevel] ?? previousLevel,
      to: romanLevels[nextLevel] ?? nextLevel
    }));
    await this.showStats({ creature, previousLevel, nextLevel });
    await this.showDialog(this.t("creature_level.congrats", { creature: creatureName }));

    nodes.overlay.classList.add("is-leaving");
    await wait(260);
    this.reset();
    nodes.overlay.hidden = true;
  }

  reset() {
    const nodes = this.ensureNodes();
    nodes.overlay.classList.remove("is-leaving");
    nodes.orbit.className = "creature-level-up-orbit";
    nodes.sprite.className = "creature-level-up-sprite";
    nodes.sprite.removeAttribute("style");
    nodes.stats.hidden = true;
    nodes.stats.classList.remove("is-visible");
    nodes.statList.innerHTML = "";
    nodes.dialog.hidden = true;
    nodes.dialogLog.innerHTML = "";
  }

  showDialog(message) {
    const nodes = this.ensureNodes();
    nodes.dialogLog.innerHTML = "";
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    const indicator = document.createElement("span");
    indicator.className = "map-dialog-continue-indicator";
    indicator.textContent = "▼";
    paragraph.append(indicator);
    nodes.dialogLog.append(paragraph);
    nodes.dialog.hidden = false;

    return this.waitForInteraction().then(() => {
      nodes.dialog.hidden = true;
      nodes.dialogLog.innerHTML = "";
    });
  }

  waitForInteraction() {
    const nodes = this.ensureNodes();
    return new Promise((resolve) => {
      let done = false;
      const complete = (event) => {
        event.preventDefault?.();
        event.stopPropagation?.();
        if (done) return;
        done = true;
        nodes.overlay.removeEventListener("pointerup", complete, true);
        window.removeEventListener("keydown", complete, true);
        resolve();
      };
      nodes.overlay.addEventListener("pointerup", complete, true);
      window.addEventListener("keydown", complete, true);
    });
  }

  async showStats({ creature, previousLevel, nextLevel }) {
    const nodes = this.ensureNodes();
    const before = inheritedStatsForCreature(creature, previousLevel);
    const after = inheritedStatsForCreature(creature, nextLevel);
    const definitions = Object.fromEntries(statDefinitions.map((stat) => [stat.id, stat]));

    nodes.statsTitle.textContent = this.t("creature_level.stats_title");
    nodes.statList.innerHTML = "";
    const visibleStatIds = inheritableStatIds.filter((statId) => (before[statId] ?? 0) >= 1 || (after[statId] ?? 0) >= 1);
    const rows = visibleStatIds.map((statId) => {
      const definition = definitions[statId];
      const row = document.createElement("div");
      row.className = "creature-level-up-stat";
      const label = document.createElement("span");
      label.className = "creature-level-up-stat-label";
      label.textContent = definition ? this.t(definition.nameKey) : statId;
      const value = document.createElement("span");
      value.className = "creature-level-up-stat-value";
      value.textContent = `${before[statId] ?? 0}${definition?.suffix ?? ""}`;
      row.append(label, value);
      nodes.statList.append(row);
      return {
        value,
        from: before[statId] ?? 0,
        to: after[statId] ?? 0,
        suffix: definition?.suffix ?? ""
      };
    });

    nodes.stats.hidden = false;
    await nextFrame();
    nodes.stats.classList.add("is-visible");
    await wait(650);
    await this.animateStatRows(rows);
  }

  animateStatRows(rows) {
    const duration = 1600;
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        rows.forEach((row) => {
          const value = Math.round(row.from + (row.to - row.from) * eased);
          row.value.textContent = `${value}${row.suffix}`;
          row.value.classList.toggle("is-up", row.to > row.from && progress < 1);
        });
        if (progress < 1) {
          window.requestAnimationFrame(step);
          return;
        }
        rows.forEach((row) => row.value.classList.toggle("is-up", row.to > row.from));
        resolve();
      };
      window.requestAnimationFrame(step);
    });
  }
}
