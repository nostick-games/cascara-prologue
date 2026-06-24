import { assetPath } from "../utils/assetPath.js";
import { hpRechargeStepDelay } from "../utils/hpRechargeTiming.js";
import { nativeHaptic } from "../utils/nativeBridge.js";

const goldIconSrc = assetPath("assets/inventaire/or.png");
const gemIconSrc = assetPath("assets/inventaire/gemme.png");

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export class MapHealerFlow {
  constructor({
    t,
    getGold,
    setGold,
    getHpCost,
    setHpCost,
    getGemCost,
    setGemCost,
    getHeroStatus,
    setHeroHp,
    getMaxGems,
    getUnspentGems,
    resetTalents,
    getHeroName,
    render = () => {}
  }) {
    this.t = t;
    this.getGold = getGold;
    this.setGold = setGold;
    this.getHpCost = getHpCost;
    this.setHpCost = setHpCost;
    this.getGemCost = getGemCost;
    this.setGemCost = setGemCost;
    this.getHeroStatus = getHeroStatus;
    this.setHeroHp = setHeroHp;
    this.getMaxGems = getMaxGems;
    this.getUnspentGems = getUnspentGems;
    this.resetTalents = resetTalents;
    this.getHeroName = getHeroName;
    this.render = render;
    this.goldCounter = null;
    this.goldValueNode = null;
    this.hpPanel = null;
    this.hpPanelContent = null;
    this.hpLabelNode = null;
    this.hpTextNode = null;
    this.hpBarNode = null;
    this.hpContinueIndicator = null;
    this.gemsPanel = null;
    this.gemsValueNode = null;
  }

  async run(service, host, { speaker }) {
    this.host = host;
    this.service = service;
    this.speaker = speaker;
    this.ensureGoldCounter();
    this.setServiceActive(true);
    this.showGoldCounter();

    try {
      const hero = this.getHeroName();
      let showIntro = true;
      while (showIntro) {
        const choice = await host.playChoiceDialog({
          message: `${speaker} : ${this.t(service.introKey, { hero })}`,
          options: [
            { label: this.t(service.browseKey), value: "browse" },
            { label: this.t(service.exitKey), value: "exit" }
          ],
          messageHighlights: [speaker, hero],
          optionLayout: "vertical",
          autoHide: false
        });

        if (choice !== "browse") return;
        const result = await this.browseServices();
        showIntro = result === "intro";
        if (result === "done" || result === "exit") return;
      }
    } finally {
      this.hideHpPanel();
      this.hideGemsPanel();
      this.setServiceActive(false);
      this.hideGoldCounter();
      host.hideDialog();
      host.hideMapChoicePanel();
    }
  }

  async browseServices() {
    while (true) {
      this.host.hideDialog();
      const selectedService = await this.host.activateMapChoicePanel([
        {
          label: this.t(this.service.hpServiceKey),
          value: "hp",
          price: this.getHpCost(),
          iconSrc: goldIconSrc
        },
        {
          label: this.t(this.service.gemsServiceKey),
          value: "gems",
          price: this.getGemCost(),
          iconSrc: goldIconSrc
        }
      ], { cancelOnOutside: true });

      if (!selectedService) return "exit";
      const result = selectedService === "hp"
        ? await this.showHpDetails()
        : await this.showGemsDetails();
      if (result === "more") continue;
      return result;
    }
  }

  async showHpDetails() {
    const choice = await this.host.playChoiceDialog({
      message: `${this.speaker} : ${this.t(this.service.hpDetailsKey)}`,
      options: [
        { label: this.t(this.service.confirmKey), value: "buy" },
        { label: this.t(this.service.moreKey), value: "more" },
        { label: this.t(this.service.cancelKey), value: "intro" }
      ],
      messageHighlights: [this.speaker],
      optionLayout: "vertical",
      autoHide: false
    });

    if (choice === "more") return "more";
    if (choice !== "buy") return "intro";
    return this.buyHpRestore();
  }

  async showGemsDetails() {
    const choice = await this.host.playChoiceDialog({
      message: `${this.speaker} : ${this.t(this.service.gemsDetailsKey)}`,
      options: [
        { label: this.t(this.service.confirmKey), value: "buy" },
        { label: this.t(this.service.moreKey), value: "more" },
        { label: this.t(this.service.cancelKey), value: "intro" }
      ],
      messageHighlights: [this.speaker],
      optionLayout: "vertical",
      autoHide: false
    });

    if (choice === "more") return "more";
    if (choice !== "buy") return "intro";
    return this.buyGemRestore();
  }

  async buyHpRestore() {
    const cost = this.getHpCost();
    if (this.isHeroFullHp()) {
      await this.host.playMessageDialog({
        message: `${this.speaker} : ${this.t(this.service.fullHpKey)}`,
        messageHighlights: [this.speaker]
      });
      return "more";
    }
    if (this.getGold() < cost) {
      await this.host.playMessageDialog({
        message: `${this.speaker} : ${this.t(this.service.notEnoughGoldKey)}`,
        messageHighlights: [this.speaker]
      });
      return "more";
    }

    this.host.hideDialog();
    this.host.hideMapChoicePanel();
    await this.spendGold(cost);
    await this.restoreHeroHp();
    this.setHpCost(cost + 2);
    this.hideHpPanel();
    await this.showThanks();
    return "done";
  }

  async buyGemRestore() {
    const cost = this.getGemCost();
    if (this.hasFullGems()) {
      await this.host.playMessageDialog({
        message: `${this.speaker} : ${this.t(this.service.fullGemsKey)}`,
        messageHighlights: [this.speaker]
      });
      return "more";
    }
    if (this.getGold() < cost) {
      await this.host.playMessageDialog({
        message: `${this.speaker} : ${this.t(this.service.notEnoughGoldKey)}`,
        messageHighlights: [this.speaker]
      });
      return "more";
    }

    this.host.hideDialog();
    this.host.hideMapChoicePanel();
    await this.spendGold(cost);
    await this.restoreGems();
    this.setGemCost(cost + 5);
    this.hideGemsPanel();
    this.hideHpPanel();
    await this.showThanks();
    return "done";
  }

  async showThanks() {
    const hero = this.getHeroName();
    await wait(80);
    await this.host.playMessageDialog({
      message: `${this.speaker} : ${this.t(this.service.thanksKey, { hero })}`,
      messageHighlights: [this.speaker, hero]
    });
  }

  isHeroFullHp() {
    const hero = this.getHeroStatus();
    const maxHp = Math.max(1, hero.maxHp ?? 1);
    const hp = Math.max(0, Math.min(maxHp, hero.hp ?? maxHp));
    return hp >= maxHp;
  }

  hasFullGems() {
    return Math.max(0, this.getUnspentGems()) >= Math.max(0, this.getMaxGems());
  }

  async spendGold(cost) {
    for (let index = 0; index < cost; index += 1) {
      this.setGold(Math.max(0, this.getGold() - 1));
      this.updateGoldCounter();
      this.render();
      await wait(28);
    }
  }

  async restoreGems() {
    const start = Math.max(0, this.getUnspentGems());
    const max = Math.max(start, this.getMaxGems());
    this.showGemsPanel();
    this.updateGemsPanel(start);
    await wait(180);
    this.resetTalents();
    const missing = Math.max(0, max - start);
    const stepDelay = hpRechargeStepDelay(missing);
    if (missing <= 0) {
      this.updateGemsPanel(max);
      this.render();
      await wait(360);
      await this.waitForHpPanelContinue();
      return;
    }
    for (let value = start + 1; value <= max; value += 1) {
      this.updateGemsPanel(value);
      this.render();
      nativeHaptic("light");
      await wait(stepDelay);
    }
    await this.waitForHpPanelContinue();
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
    this.hpPanelContent = document.createElement("div");
    this.hpPanelContent.className = "map-healer-panel-content";
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
    this.hpPanelContent.append(hpBox);
    this.hpPanel.append(this.hpPanelContent, this.hpContinueIndicator);
    this.host.nodes.mapSection.append(this.hpPanel);
  }

  showHpPanel() {
    this.ensureHpPanel();
    this.showPanelChild(this.hpPanelContent?.querySelector(".inventory-hp"));
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
    const eventNames = this.host?.isMobile?.() ? ["pointerdown"] : ["keydown"];
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
        window.setTimeout(resolve, this.host?.isMobile?.() ? 220 : 0);
      };
      eventNames.forEach((eventName) => window.addEventListener(eventName, handler, true));
    });
  }

  ensureGemsPanel() {
    this.ensureHpPanel();
    if (this.gemsPanel || !this.hpPanelContent) return;
    this.gemsPanel = document.createElement("div");
    this.gemsPanel.className = "map-healer-gems-panel";
    this.gemsPanel.hidden = true;
    const icon = document.createElement("img");
    icon.src = gemIconSrc;
    icon.alt = "";
    const equals = document.createElement("span");
    equals.className = "map-healer-gems-equals";
    equals.textContent = "=";
    this.gemsValueNode = document.createElement("span");
    this.gemsValueNode.className = "map-healer-gems-value";
    this.gemsPanel.append(icon, equals, this.gemsValueNode);
    this.hpPanelContent.append(this.gemsPanel);
  }

  showGemsPanel() {
    this.ensureGemsPanel();
    this.showPanelChild(this.gemsPanel);
    if (this.hpContinueIndicator) this.hpContinueIndicator.hidden = true;
    if (this.hpPanel) this.hpPanel.hidden = false;
    if (this.gemsPanel) this.gemsPanel.hidden = false;
  }

  hideGemsPanel() {
    if (this.gemsPanel) this.gemsPanel.hidden = true;
  }

  updateGemsPanel(value) {
    if (this.gemsValueNode) this.gemsValueNode.textContent = String(value);
  }

  showPanelChild(activeChild) {
    if (!this.hpPanelContent) return;
    [...this.hpPanelContent.children].forEach((child) => {
      child.hidden = child !== activeChild;
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
