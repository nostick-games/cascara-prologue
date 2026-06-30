import { renderHighlightedDialogText } from "../screens/map/mapDialogUi.js";

const defaultLinePauseMs = 720;
const defaultTypeDelayMs = 12;

export class CombatLog {
  constructor({ node, linePauseMs = defaultLinePauseMs, typeDelayMs = defaultTypeDelayMs, t = (key) => key }) {
    this.node = node;
    this.linePauseMs = linePauseMs;
    this.typeDelayMs = typeDelayMs;
    this.t = t;
    this.queue = [];
    this.typing = false;
    this.idleCallbacks = [];
  }

  isBusy() {
    return this.typing || this.queue.length > 0;
  }

  // Exécute le callback quand le journal a fini de tout taper (file vide + plus de
  // frappe). Sert à ne déclencher le 1er tour ennemi qu'après la narration d'ouverture.
  runWhenIdle(callback) {
    if (!this.isBusy()) {
      callback();
      return;
    }
    this.idleCallbacks.push(callback);
  }

  add(message, afterTyped = null, options = {}) {
    const line = document.createElement("div");
    line.className = "log-line";
    this.node.append(line);
    this.queue.push({ line, message, afterTyped, options });
    this.typeNext();
  }

  addContinueIndicator(afterTyped = null) {
    const line = document.createElement("div");
    line.className = "log-line log-continue-line";
    this.node.append(line);
    this.queue.push({ line, message: "", afterTyped, options: { continueIndicator: true } });
    this.typeNext();
  }

  addReward(message, reward, afterTyped = null) {
    const line = document.createElement("div");
    const textNode = document.createElement("div");
    line.className = "log-line log-reward";
    textNode.className = "log-reward-text";
    line.append(textNode);
    this.node.append(line);
    this.queue.push({ line, textNode, message, reward, afterTyped });
    this.typeNext();
  }

  clear() {
    this.node.innerHTML = "";
    this.queue = [];
    this.typing = false;
    this.idleCallbacks = [];
  }

  typeNext() {
    if (this.typing) return;
    if (this.queue.length === 0) {
      const callbacks = this.idleCallbacks;
      this.idleCallbacks = [];
      callbacks.forEach((callback) => callback());
      return;
    }
    this.typing = true;
    const { line, textNode, message, reward, afterTyped, options = {} } = this.queue.shift();
    const target = textNode ?? line;
    if (options.continueIndicator) {
      const indicator = document.createElement("span");
      indicator.className = "combat-continue-indicator";
      indicator.setAttribute("aria-hidden", "true");
      indicator.textContent = "▼";
      target.append(indicator);
      this.node.scrollTop = this.node.scrollHeight;
      this.typing = false;
      afterTyped?.();
      this.typeNext();
      return;
    }
    const highlights = options.highlights ?? [];
    let index = 0;
    const step = () => {
      const slice = message.slice(0, index);
      if (highlights.length) renderHighlightedDialogText(target, slice, highlights);
      else target.textContent = slice;
      this.node.scrollTop = this.node.scrollHeight;
      index += 1;
      if (index <= message.length) {
        window.setTimeout(step, this.typeDelayMs);
        return;
      }

      const cursor = document.createElement("span");
      cursor.className = "log-cursor";
      target.append(cursor);
      const rewardDelay = reward ? this.renderRewardGauge(line, reward, 1180) : 0;
      window.setTimeout(() => {
        cursor.remove();
        this.typing = false;
        afterTyped?.();
        this.typeNext();
      }, this.linePauseMs + rewardDelay);
    };

    step();
  }

  renderRewardGauge(line, reward, introDelayMs = 0) {
    const starsPerXp = reward.starsPerXp ?? 100;
    const blockCount = 10;
    const before = reward.starsBefore ?? 0;
    const after = reward.starsAfter ?? 0;
    const unspentXpBefore = reward.unspentXpBefore ?? reward.availableXpBefore ?? reward.availableXp ?? 0;
    const unspentXpAfter = reward.unspentXp ?? reward.availableXp ?? unspentXpBefore;
    const fillTarget = reward.gainedXp > 0 ? starsPerXp : after;
    const fillDurationMs = 2800;
    const refillDurationMs = reward.gainedXp > 0 && after > 0 ? Math.max(900, after * 45) : 0;
    const resetPauseMs = reward.gainedXp > 0 ? 420 : 0;

    const mountGauge = () => {
      const gauge = document.createElement("div");
      gauge.className = "xp-reward-gauge";

      const blocks = document.createElement("div");
      blocks.className = "xp-reward-blocks";

      const blockNodes = Array.from({ length: blockCount }).map(() => {
        const block = document.createElement("span");
        block.className = "xp-reward-block";
        blocks.append(block);
        return block;
      });

      const counters = document.createElement("div");
      counters.className = "xp-reward-counters";
      const { counter: starsCounter, value: starsValue } = this.createRewardCounter({
        icon: "assets/inventaire/XP.png",
        alt: this.t("combat.reward.stars_alt"),
        value: `${before}/${starsPerXp}`,
        align: "left"
      });
      const { counter: gemsCounter, value: gemsValue } = this.createRewardCounter({
        icon: "assets/inventaire/gemme.png",
        alt: this.t("combat.reward.gems_alt"),
        value: unspentXpBefore,
        align: "right"
      });
      counters.append(starsCounter, gemsCounter);

      gauge.append(blocks, counters);
      line.append(gauge);
      this.node.scrollTop = this.node.scrollHeight;
      this.setRewardGaugeFill(blockNodes, before, starsPerXp);
      this.animateCounterByStep({
        from: before,
        to: fillTarget,
        duration: fillDurationMs,
        onUpdate: (value) => {
          starsValue.textContent = `${value}/${starsPerXp}`;
          this.setRewardGaugeFill(blockNodes, value, starsPerXp);
        },
        onComplete: () => {
          if (reward.gainedXp <= 0) return;
          this.animateCounter({
            from: unspentXpBefore,
            to: unspentXpAfter,
            duration: 480,
            onUpdate: (value) => {
              gemsValue.textContent = value;
            },
            onComplete: () => {
              window.setTimeout(() => {
                this.setRewardGaugeFill(blockNodes, 0, starsPerXp);
                starsValue.textContent = `0/${starsPerXp}`;
                if (after <= 0) return;
                this.animateCounterByStep({
                  from: 0,
                  to: after,
                  duration: refillDurationMs,
                  onUpdate: (value) => {
                    starsValue.textContent = `${value}/${starsPerXp}`;
                    this.setRewardGaugeFill(blockNodes, value, starsPerXp);
                  }
                });
              }, resetPauseMs);
            }
          });
        }
      });
    };

    window.setTimeout(mountGauge, introDelayMs);
    return introDelayMs + fillDurationMs + (reward.gainedXp > 0 ? 540 + resetPauseMs + refillDurationMs : 120);
  }

  createRewardCounter({ icon, alt, value, align }) {
    const counter = document.createElement("small");
    counter.className = `xp-reward-label ${align === "right" ? "right" : "left"}`;
    counter.setAttribute("aria-label", alt);
    const image = document.createElement("img");
    image.src = icon;
    image.alt = alt;
    const valueNode = document.createElement("span");
    valueNode.textContent = value;
    counter.append(image, valueNode);
    return { counter, value: valueNode };
  }

  setRewardGaugeFill(blocks, stars, starsPerXp) {
    const starsPerBlock = starsPerXp / blocks.length;
    blocks.forEach((block, index) => {
      const blockStart = index * starsPerBlock;
      const fillRatio = Math.max(0, Math.min(1, (stars - blockStart) / starsPerBlock));
      const fillWidth = Math.round((block.clientWidth * fillRatio) / 2) * 2;
      block.style.setProperty("--fill-width", `${fillWidth}px`);
      block.classList.toggle("filled", fillRatio > 0);
    });
  }

  animateCounterByStep({ from, to, duration, onUpdate, onComplete = null }) {
    const distance = Math.abs(to - from);
    if (distance === 0) {
      onUpdate(to);
      onComplete?.();
      return;
    }

    const direction = to > from ? 1 : -1;
    let value = from;
    onUpdate(value);
    const delay = Math.max(40, duration / distance);
    const tick = () => {
      value += direction;
      onUpdate(value);
      if (value === to) {
        onComplete?.();
        return;
      }
      window.setTimeout(tick, delay);
    };
    window.setTimeout(tick, delay);
  }

  animateCounter({ from, to, duration, onUpdate, onComplete = null }) {
    const startedAt = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      onUpdate(Math.round(from + ((to - from) * eased)));
      if (progress < 1) {
        window.requestAnimationFrame(step);
        return;
      }
      onComplete?.();
    };
    window.requestAnimationFrame(step);
  }
}
