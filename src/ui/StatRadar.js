import { bindPress } from "./bindPress.js";

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export class StatRadar {
    constructor({
      canvas,
      controlsNode,
      modal,
      modalTitle,
      modalDescription,
      modalPoints,
      modalClose,
      modalShield,
      stats,
      build,
      initialBuild,
      resetBuild = initialBuild,
      totalPoints,
      t,
      isLocked = () => false,
      onChange = () => {}
    }) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.controlsNode = controlsNode;
      this.modal = modal;
      this.modalTitle = modalTitle;
      this.modalDescription = modalDescription;
      this.modalPoints = modalPoints;
      this.modalClose = modalClose;
      this.modalShield = modalShield;
      this.stats = stats;
      this.build = build;
      this.initialBuild = initialBuild;
      this.resetBuild = resetBuild;
      this.totalPoints = totalPoints;
      this.t = t;
      this.isLocked = isLocked;
      this.onChange = onChange;
      this.allocatableStats = stats.filter((stat) => !stat.locked);
      // Bonus additif par stat (ex. stats héritables des créatures équipées).
      // N'entame pas les points d'XP : il décale seulement le radar par-dessus le build.
      this.bonus = {};
      this.effectiveBuild = { ...build };
      // Valeurs réellement dessinées : interpolées vers effectiveBuild pour animer le radar.
      this.displayedBuild = { ...build };
      this.statValueNodes = {};
      this.radarAnimationFrame = null;
      this.radarAnimationTimeout = null;
      this.animationToken = null;
      // Échelle d'ouverture : 0 = points au centre, 1 = positions réelles.
      this.introScale = 1;
      // Pulsation de l'intérieur du radar à la couleur du type dominant.
      this.pulseColorRgb = null;
      this.pulseIntensity = 0;
      this.pulseFrame = null;

      bindPress(this.modalClose, () => this.closeModal());
      this.canvas.addEventListener("click", (event) => this.handleCanvasClick(event));
    }

    spentPoints() {
      return this.allocatableStats.reduce(
        (sum, stat) => sum + Math.max(0, this.build[stat.id] - this.initialBuild[stat.id]),
        0
      );
    }

    resettableSpentPoints() {
      return this.allocatableStats.reduce(
        (sum, stat) => sum + Math.max(0, this.build[stat.id] - this.resetBuild[stat.id]),
        0
      );
    }

    pointsLeft() {
      return this.totalPoints - this.spentPoints();
    }

    setTotalPoints(totalPoints) {
      this.totalPoints = totalPoints;
    }

    setBonus(bonus) {
      this.bonus = bonus ?? {};
    }

    statBonus(stat) {
      return this.bonus[stat.id] ?? 0;
    }

    // Valeur affichée = build du joueur + bonus des créatures, bornée au radar.
    effectiveValue(stat) {
      return clamp((this.build[stat.id] ?? 0) + this.statBonus(stat), stat.min, stat.max);
    }

    computeEffectiveBuild() {
      const effective = {};
      this.stats.forEach((stat) => {
        effective[stat.id] = this.effectiveValue(stat);
      });
      return effective;
    }

    statName(stat) {
      return this.t(stat.nameKey);
    }

    statDescription(stat) {
      return this.t(stat.descriptionKey);
    }

    formatStatValue(stat, value = this.build[stat.id]) {
      return `${value}${stat.suffix || ""}`;
    }

    normalizedStat(stat, source = this.build) {
      const range = stat.max - stat.min;
      if (range <= 0) return 0;
      return clamp((source[stat.id] - stat.min) / range, 0, 1);
    }

    getPoint(stat, index, radius, source = this.build) {
      const angle = (-Math.PI / 2) + (index / this.stats.length) * Math.PI * 2;
      const value = this.normalizedStat(stat, source);
      return {
        x: Math.cos(angle) * radius * (0.22 + value * 0.78),
        y: Math.sin(angle) * radius * (0.22 + value * 0.78),
        color: stat.color,
        stat
      };
    }

    renderControls() {
      const gameLocked = this.isLocked();
      this.controlsNode.innerHTML = "";

      this.stats.forEach((stat, index) => {
        const angle = (-Math.PI / 2) + (index / this.stats.length) * Math.PI * 2;
        const radius = 43;

        const control = document.createElement("div");
        control.className = `radar-control radar-control-${stat.id}${stat.locked ? " locked" : ""}`;
        control.style.setProperty("--control-x", `${50 + Math.cos(angle) * radius}%`);
        control.style.setProperty("--control-y", `${50 + Math.sin(angle) * radius}%`);
        control.style.setProperty("--control-color", stat.color);
        control.title = `${this.statName(stat)} - ${this.statDescription(stat)}`;

        const label = document.createElement("div");
        label.className = "radar-control-label";
        label.textContent = this.statName(stat);

        const minus = document.createElement("button");
        minus.className = "radar-square";
        minus.type = "button";
        minus.textContent = "−";
        minus.disabled = stat.locked || this.build[stat.id] <= this.resetBuild[stat.id] || gameLocked;
        minus.setAttribute("aria-label", this.t("radar.remove_point", { stat: this.statName(stat) }));
        bindPress(minus, () => {
          this.build[stat.id] -= 1;
          this.onChange();
        });

        const effectiveValue = this.effectiveValue(stat);
        const displayedValue = Math.round(this.displayedBuild[stat.id] ?? effectiveValue);
        const value = document.createElement("div");
        value.className = "radar-square value";
        value.textContent = this.formatStatValue(stat, displayedValue);
        value.setAttribute(
          "aria-label",
          this.t("radar.value", { stat: this.statName(stat), value: this.formatStatValue(stat, effectiveValue) })
        );
        this.statValueNodes[stat.id] = value;

        const plus = document.createElement("button");
        plus.className = "radar-square";
        plus.type = "button";
        plus.textContent = "+";
        plus.disabled = stat.locked || effectiveValue >= stat.max || this.pointsLeft() <= 0 || gameLocked;
        plus.setAttribute("aria-label", this.t("radar.add_point", { stat: this.statName(stat) }));
        bindPress(plus, () => {
          this.build[stat.id] += 1;
          this.onChange();
        });

        control.append(label, minus, value, plus);
        this.controlsNode.append(control);
      });
    }

    openModal(stat) {
      this.modalTitle.textContent = this.statName(stat);
      this.modalDescription.textContent = this.statDescription(stat);
      this.modalPoints.textContent = this.t("radar.stat_value", {
        value: this.formatStatValue(stat, this.effectiveValue(stat)),
        max: this.formatStatValue(stat, stat.max)
      });
      this.modal.style.setProperty("--modal-color", stat.color);
      this.modalShield.hidden = false;
      this.modal.hidden = false;
    }

    closeModal() {
      this.modal.hidden = true;
      this.modalShield.hidden = true;
    }

    handleCanvasClick(event) {
      if (!this.modal.hidden) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX - this.canvas.width / 2;
      const y = (event.clientY - rect.top) * scaleY - this.canvas.height / 2;
      const radius = this.canvas.width * 0.32;
      const hitRadius = 34;

      const hit = this.stats
        .map((stat, index) => this.getPoint(stat, index, radius, this.displayedBuild))
        .find((point) => Math.hypot(point.x - x, point.y - y) <= hitRadius);

      if (hit) {
        this.openModal(hit.stat);
      }
    }

    drawRadarOutline(radius) {
      const ctx = this.ctx;
      ctx.beginPath();
      this.stats.forEach((stat, index) => {
        const angle = (-Math.PI / 2) + (index / this.stats.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
    }

    draw() {
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = width * 0.32;
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineWidth = 1;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Pulsation : halo radial de la couleur du type dominant qui remplit l'intérieur.
      // L'opacité suit introScale pour apparaître progressivement pendant l'ouverture.
      if (this.pulseColorRgb && this.introScale > 0) {
        const [r, g, b] = this.pulseColorRgb;
        const glowAlpha = (0.12 + this.pulseIntensity * 0.26) * this.introScale;
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        glow.addColorStop(0, `rgba(${r},${g},${b},${glowAlpha})`);
        glow.addColorStop(0.7, `rgba(${r},${g},${b},${glowAlpha * 0.4})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.save();
        this.drawRadarOutline(radius);
        ctx.clip();
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.restore();
      }

      for (let ring = 1; ring <= 5; ring += 1) {
        const ringRadius = radius * (ring / 5);
        this.drawRadarOutline(ringRadius);
        ctx.strokeStyle = ring === 5 ? "rgba(241,198,106,0.42)" : "rgba(255,255,255,0.12)";
        ctx.stroke();
      }

      this.stats.forEach((stat, index) => {
        const angle = (-Math.PI / 2) + (index / this.stats.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.stroke();
      });

      // Le polygone de base (référence) grandit lui aussi depuis le centre et apparaît
      // en fondu avec introScale : on ne voit pas l'intérieur du radar avant l'explosion.
      const intro = this.introScale;
      const initialPoints = this.stats.map((stat, index) => {
        const point = this.getPoint(stat, index, radius, this.initialBuild);
        return { ...point, x: point.x * intro, y: point.y * intro };
      });
      ctx.beginPath();
      initialPoints.forEach((point, index) => {
        index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fillStyle = `rgba(255,255,255,${0.08 * intro})`;
      ctx.strokeStyle = `rgba(255,255,255,${0.22 * intro})`;
      ctx.fill();
      ctx.stroke();

      const currentPoints = this.stats.map((stat, index) => {
        const point = this.getPoint(stat, index, radius, this.displayedBuild);
        // À l'ouverture, introScale ramène les points vers le centre puis les libère.
        return { ...point, x: point.x * this.introScale, y: point.y * this.introScale };
      });
      ctx.beginPath();
      currentPoints.forEach((point, index) => {
        index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      // Le remplissage (bleu ou couleur de type) apparaît en fondu avec introScale.
      if (this.pulseColorRgb) {
        const [r, g, b] = this.pulseColorRgb;
        ctx.fillStyle = `rgba(${r},${g},${b},${(0.18 + this.pulseIntensity * 0.3) * intro})`;
      } else {
        ctx.fillStyle = `rgba(95,180,217,${0.22 * intro})`;
      }
      ctx.strokeStyle = "rgba(241,198,106,0.88)";
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      currentPoints.forEach((point) => {
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

    render() {
      this.effectiveBuild = this.computeEffectiveBuild();
      this.renderControls();
      // animateToEffective ne déclenche une transition que si une valeur a changé
      // (allocation manuelle de points ou bonus de créature) ; sinon, dessin direct.
      this.animateToEffective();
    }

    updateValueTexts() {
      this.stats.forEach((stat) => {
        const node = this.statValueNodes[stat.id];
        if (node) {
          node.textContent = this.formatStatValue(stat, Math.round(this.displayedBuild[stat.id] ?? 0));
        }
      });
    }

    cancelRadarAnimation() {
      if (this.radarAnimationFrame) {
        cancelAnimationFrame(this.radarAnimationFrame);
        this.radarAnimationFrame = null;
      }
      if (this.radarAnimationTimeout) {
        clearTimeout(this.radarAnimationTimeout);
        this.radarAnimationTimeout = null;
      }
    }

    // Moteur d'animation partagé : appelle onTick(eased) à chaque frame avec un ease-out
    // cubique (départ explosif, ralentissement en fin). Un setTimeout garantit l'état final
    // même si requestAnimationFrame est throttlé/suspendu (onglet en arrière-plan, etc.).
    runRadarAnimation(duration, onTick) {
      this.cancelRadarAnimation();
      const token = Symbol("radar-animation");
      this.animationToken = token;
      const startTime = performance.now();

      const finalize = () => {
        if (this.animationToken !== token) return;
        this.cancelRadarAnimation();
        this.animationToken = null;
        onTick(1);
      };

      const step = (now) => {
        if (this.animationToken !== token) return;
        const progress = Math.min(1, (now - startTime) / duration);
        onTick(1 - Math.pow(1 - progress, 3));
        if (progress < 1) {
          this.radarAnimationFrame = requestAnimationFrame(step);
        } else {
          finalize();
        }
      };

      this.radarAnimationFrame = requestAnimationFrame(step);
      this.radarAnimationTimeout = setTimeout(finalize, duration + 120);
    }

    // Interpole displayedBuild vers effectiveBuild : le polygone (lignes jaunes) et les
    // chiffres des boutons progressent en douceur (allocation de points ou bonus de créature).
    animateToEffective() {
      const start = { ...this.displayedBuild };
      const target = this.effectiveBuild;
      const statIds = this.stats.map((stat) => stat.id);
      const changed = statIds.some((id) => Math.abs((start[id] ?? 0) - (target[id] ?? 0)) > 0.001);

      if (!changed && this.introScale === 1) {
        this.cancelRadarAnimation();
        this.displayedBuild = { ...target };
        this.updateValueTexts();
        this.draw();
        return;
      }

      this.runRadarAnimation(480, (eased) => {
        statIds.forEach((id) => {
          const from = start[id] ?? 0;
          const to = target[id] ?? 0;
          this.displayedBuild[id] = from + (to - from) * eased;
        });
        this.introScale = 1;
        this.updateValueTexts();
        this.draw();
      });
    }

    // Animation d'ouverture : les points de couleur partent du centre (introScale 0) et les
    // valeurs du minimum, puis filent vers leur niveau réel avec un départ explosif.
    playIntro() {
      this.effectiveBuild = this.computeEffectiveBuild();
      const target = { ...this.effectiveBuild };
      const startVals = {};
      this.stats.forEach((stat) => {
        startVals[stat.id] = stat.min;
        this.displayedBuild[stat.id] = stat.min;
      });
      this.introScale = 0;
      this.renderControls();
      this.draw();

      this.runRadarAnimation(720, (eased) => {
        this.stats.forEach((stat) => {
          this.displayedBuild[stat.id] = startVals[stat.id] + (target[stat.id] - startVals[stat.id]) * eased;
        });
        this.introScale = eased;
        this.updateValueTexts();
        this.draw();
      });
    }

    // Active/désactive la pulsation de l'intérieur du radar (couleur du type dominant).
    // `rgb` est un tableau [r, g, b] ou null pour arrêter.
    setPulseColor(rgb) {
      const current = this.pulseColorRgb;
      const same = current && rgb && current[0] === rgb[0] && current[1] === rgb[1] && current[2] === rgb[2];
      if (same || (!current && !rgb)) return;

      this.pulseColorRgb = rgb || null;
      if (this.pulseColorRgb) {
        this.startPulse();
      } else {
        this.stopPulse();
        this.draw();
      }
    }

    startPulse() {
      if (this.pulseFrame) return;
      const loop = (now) => {
        // Oscillation douce 0..1 (période ~1.4 s).
        this.pulseIntensity = 0.5 + 0.5 * Math.sin((now / 700) * Math.PI);
        this.draw();
        this.pulseFrame = requestAnimationFrame(loop);
      };
      this.pulseFrame = requestAnimationFrame(loop);
    }

    stopPulse() {
      if (this.pulseFrame) {
        cancelAnimationFrame(this.pulseFrame);
        this.pulseFrame = null;
      }
      this.pulseIntensity = 0;
    }
}
