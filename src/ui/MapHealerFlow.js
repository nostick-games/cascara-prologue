import { assetPath } from "../utils/assetPath.js";
import { hpRechargeStepDelay } from "../utils/hpRechargeTiming.js";
import { nativeHaptic } from "../utils/nativeBridge.js";

const goldIconSrc = assetPath("assets/inventaire/or.png");

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export class MapHealerFlow {
  constructor({
    t,
    getGold,
    setGold,
    getCost,
    setCost,
    getHeroStatus,
    setHeroHp,
    getHeroName,
    render = () => {}
  }) {
    this.t = t;
    this.getGold = getGold;
    this.setGold = setGold;
    this.getCost = getCost;
    this.setCost = setCost;
    this.getHeroStatus = getHeroStatus;
    this.setHeroHp = setHeroHp;
    this.getHeroName = getHeroName;
    this.render = render;
    this.goldCounter = null;
    this.goldValueNode = null;
    this.hpPanel = null;
    this.hpLabelNode = null;
    this.hpTextNode = null;
    this.hpBarNode = null;
    this.hpContinueIndicator = null;
  }

  async run(service, host, { speaker }) {
    this.host = host;
    this.service = service;
    this.speaker = speaker;
    this.ensureGoldCounter();
    this.setServiceActive(true);
    this.showGoldCounter();

    try {
      const cost = this.getCost();
      const hero = this.getHeroName();
      const choice = await host.playChoiceDialog({
        message: `${speaker} : ${this.t(service.introKey, { hero, cost })}`,
        options: [
          { label: this.t("ui.choice.yes"), value: "yes" },
          { label: this.t("ui.choice.no"), value: "no" }
        ],
        messageHighlights: [speaker, hero, String(cost)],
        optionLayout: "vertical",
        autoHide: false
      });

      if (choice !== "yes") return;
      if (this.isHeroFullHp()) {
        await host.playMessageDialog({
          message: `${speaker} : ${this.t(service.fullHpKey)}`,
          messageHighlights: [speaker]
        });
        return;
      }
      if (this.getGold() < cost) {
        await host.playMessageDialog({
          message: `${speaker} : ${this.t(service.notEnoughGoldKey)}`,
          messageHighlights: [speaker]
        });
        return;
      }

      host.hideDialog();
      host.hideMapChoicePanel();
      await this.spendGold(cost);
      await this.restoreHeroHp();
      this.setCost(cost + 2);
      this.hideHpPanel();

      await wait(80);
      await host.playMessageDialog({
        message: `${speaker} : ${this.t(service.thanksKey, { hero })}`,
        messageHighlights: [speaker, hero]
      });
    } finally {
      this.hideHpPanel();
      this.setServiceActive(false);
      this.hideGoldCounter();
      host.hideDialog();
      host.hideMapChoicePanel();
    }
  }

  isHeroFullHp() {
    const hero = this.getHeroStatus();
    const maxHp = Math.max(1, hero.maxHp ?? 1);
    const hp = Math.max(0, Math.min(maxHp, hero.hp ?? maxHp));
    return hp >= maxHp;
  }

  async spendGold(cost) {
    for (let index = 0; index < cost; index += 1) {
      this.setGold(Math.max(0, this.getGold() - 1));
      this.updateGoldCounter();
      this.render();
      await wait(28);
    }
  }

  async restoreHeroHp() {
    const hero = this.getHeroStatus();
    const maxHp = Math.max(1, hero.maxHp ?? 1);
    const startHp = Math.max(0, Math.min(maxHp, hero.hp ?? maxHp));
    this.showHpPanel();
    this.updateHpPanel(startHp, maxHp);
    await wait(180);
    const stepDelay = hpRechargeStepDelay(maxHp - startHp);
    for (let hp = startHp + 1; hp <= maxHp; hp += 1) {
      this.setHeroHp(hp, maxHp);
      this.updateHpPanel(hp, maxHp);
      this.render();
      nativeHaptic("light");
      await wait(stepDelay);
    }
    if (startHp >= maxHp) {
      this.setHeroHp(maxHp, maxHp);
      this.updateHpPanel(maxHp, maxHp);
      this.render();
      await wait(360);
    }
    await this.waitForHpPanelContinue();
  }

  ensureHpPanel() {
    if (this.hpPanel || !this.host?.nodes?.mapSection) return;
    this.hpPanel = document.createElement("div");
    this.hpPanel.className = "map-healer-hp-panel";
    this.hpPanel.hidden = true;
    const hpBox = document.createElement("div");
    hpBox.className = "inventory-hp";
    const head = document.createElement("div");
    head.className = "bar-head";
    this.hpLabelNode = document.createElement("span");
    this.hpTextNode = document.createElement("span");
    head.append(this.hpLabelNode, this.hpTextNode);
    const bar = document.createElement("div");
    bar.className = "bar";
    this.hpBarNode = document.createElement("div");
    this.hpBarNode.className = "bar-fill hp";
    bar.append(this.hpBarNode);
    hpBox.append(head, bar);
    this.hpContinueIndicator = document.createElement("span");
    this.hpContinueIndicator.className = "map-healer-continue-indicator";
    this.hpContinueIndicator.setAttribute("aria-hidden", "true");
    this.hpContinueIndicator.textContent = "▼";
    this.hpContinueIndicator.hidden = true;
    this.hpPanel.append(hpBox, this.hpContinueIndicator);
    this.host.nodes.mapSection.append(this.hpPanel);
  }

  showHpPanel() {
    this.ensureHpPanel();
    if (this.hpContinueIndicator) this.hpContinueIndicator.hidden = true;
    if (this.hpPanel) this.hpPanel.hidden = false;
  }

  hideHpPanel() {
    if (this.hpPanel) this.hpPanel.hidden = true;
  }

  updateHpPanel(hp, maxHp) {
    if (this.hpLabelNode) this.hpLabelNode.textContent = this.getHeroName();
    if (this.hpTextNode) this.hpTextNode.textContent = this.t("ui.hp", { current: hp, max: maxHp });
    if (this.hpBarNode) this.hpBarNode.style.width = `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%`;
  }

  waitForHpPanelContinue() {
    this.ensureHpPanel();
    if (this.hpContinueIndicator) this.hpContinueIndicator.hidden = false;
    const eventNames = this.host?.isMobile?.()
      ? ["pointerdown", "pointerup", "click", "touchend"]
      : ["keydown"];
    return new Promise((resolve) => {
      let resolved = false;
      const cleanup = () => {
        eventNames.forEach((eventName) => window.removeEventListener(eventName, handler, true));
      };
      const handler = (event) => {
        if (resolved) return;
        if (event.repeat) return;
        resolved = true;
        event.preventDefault?.();
        event.stopPropagation?.();
        cleanup();
        if (this.hpContinueIndicator) this.hpContinueIndicator.hidden = true;
        resolve();
      };
      eventNames.forEach((eventName) => window.addEventListener(eventName, handler, true));
    });
  }

  ensureGoldCounter() {
    if (this.goldCounter || !this.host?.nodes?.mapSection) return;
    this.goldCounter = document.createElement("div");
    this.goldCounter.className = "map-shop-gold-counter";
    this.goldCounter.hidden = true;
    const icon = document.createElement("img");
    icon.src = goldIconSrc;
    icon.alt = "";
    this.goldValueNode = document.createElement("span");
    this.goldCounter.append(icon, this.goldValueNode);
    this.host.nodes.mapSection.append(this.goldCounter);
  }

  showGoldCounter() {
    this.ensureGoldCounter();
    this.updateGoldCounter();
    if (this.goldCounter) this.goldCounter.hidden = false;
  }

  hideGoldCounter() {
    if (this.goldCounter) this.goldCounter.hidden = true;
  }

  updateGoldCounter() {
    if (this.goldValueNode) this.goldValueNode.textContent = String(this.getGold());
  }

  setServiceActive(active) {
    this.host?.nodes?.mapSection?.classList.toggle("is-shop-active", active);
  }
}
