import { setPixelButtonLabel } from "./PixelButton.js";

export class InventoryModal {
  constructor({
    shield,
    closeButton,
    optionsButton = null,
    itemsNode,
    headerNodes = {},
    t,
    getEntries,
    getActionPoints,
    getHeroStatus = () => null,
    getHeroName = () => null,
    getCurrencies = () => ({}),
    isItemEffective,
    onApply,
    onOptions = () => {},
    getMountNode = () => document.querySelector(".app") ?? document.body
  }) {
    this.shield = shield;
    this.closeButton = closeButton;
    this.optionsButton = optionsButton;
    this.itemsNode = itemsNode;
    this.headerNodes = headerNodes;
    this.t = t;
    this.getEntries = getEntries;
    this.getActionPoints = getActionPoints;
    this.getHeroStatus = getHeroStatus;
    this.getHeroName = getHeroName;
    this.getCurrencies = getCurrencies;
    this.isItemEffective = isItemEffective;
    this.onApply = onApply;
    this.onOptions = onOptions;
    this.getMountNode = getMountNode;
    this.selectedItemId = null;
    this.readOnly = false;
    this.mode = "combat";
    this.warningItemId = null;
    this.warningTimer = null;

    this.closeButton.addEventListener("click", () => this.applySelectedItem());
    this.optionsButton?.addEventListener("click", () => this.openOptions());
  }

  open({ readOnly = false, mode = "combat" } = {}) {
    this.readOnly = readOnly;
    this.mode = mode;
    this.selectedItemId = null;
    this.warningItemId = null;
    this.renderHeader();
    this.renderStaticText();
    this.renderItems();
    this.itemsNode.scrollTop = 0;
    this.getMountNode()?.append(this.shield);
    this.shield.hidden = false;
    this.closeButton.focus();
  }

  close() {
    this.selectedItemId = null;
    this.warningItemId = null;
    this.readOnly = false;
    this.mode = "combat";
    delete this.itemsNode.dataset.warningKey;
    window.clearTimeout(this.warningTimer);
    this.shield.hidden = true;
  }

  openOptions() {
    this.close();
    this.onOptions();
  }

  renderStaticText() {
    setPixelButtonLabel(this.closeButton, this.t("ui.ok"));
    if (this.optionsButton) setPixelButtonLabel(this.optionsButton, this.t("ui.options"));
  }

  async applySelectedItem() {
    if (this.readOnly || !this.selectedItemId) {
      this.close();
      return;
    }

    const entry = this.getEntries().find(({ item }) => item.id === this.selectedItemId);
    if (!entry || (this.mode === "combat" && this.getActionPoints() < entry.item.paCost)) {
      this.renderItems();
      return;
    }

    if (!this.isItemEffective(entry.item)) {
      this.showItemWarning(entry.item.id);
      return;
    }

    await this.onApply(entry, { mode: this.mode });
  }

  showItemWarning(itemId, messageKey = "ui.inventory_no_effect") {
    this.warningItemId = itemId;
    this.itemsNode.dataset.warningKey = messageKey;
    window.clearTimeout(this.warningTimer);
    this.itemsNode.querySelectorAll(".inventory-warning").forEach((warning) => warning.remove());
    this.itemsNode.querySelectorAll(".inventory-item-block.selected").forEach((block) => block.classList.remove("selected"));
    const targetBlock = [...this.itemsNode.querySelectorAll(".inventory-item-block")]
      .find((block) => block.dataset.itemId === itemId);

    if (targetBlock) {
      const warning = document.createElement("div");
      warning.className = "inventory-warning";
      warning.textContent = this.t(messageKey);
      targetBlock.append(warning);
    }

    this.warningTimer = window.setTimeout(() => {
      this.warningItemId = null;
      delete this.itemsNode.dataset.warningKey;
      this.itemsNode.querySelectorAll(".inventory-warning").forEach((warning) => warning.remove());
    }, 1800);
  }

  renderItems() {
    this.itemsNode.innerHTML = "";
    const entries = this.getEntries();
    if (entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "inventory-empty";
      empty.textContent = this.t("ui.inventory_empty_combat");
      this.itemsNode.append(empty);
      return;
    }

    entries.forEach(({ item, quantity }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "inventory-item";

      const block = document.createElement("button");
      const hasEnoughPa = this.readOnly || this.mode !== "combat" || this.getActionPoints() >= item.paCost;
      const selected = this.selectedItemId === item.id;
      block.type = "button";
      block.className = `inventory-item-block${selected ? " selected" : ""}${hasEnoughPa ? "" : " unavailable"}`;
      block.dataset.itemId = item.id;
      block.setAttribute("aria-label", this.t(item.nameKey));

      const sprite = document.createElement("img");
      sprite.className = "inventory-item-sprite";
      sprite.src = item.sprite;
      sprite.alt = "";

      const count = document.createElement("span");
      count.className = "inventory-count";
      count.textContent = Math.min(99, quantity);

      block.append(sprite, count);
      if (this.mode === "combat") {
        const cost = document.createElement("span");
        cost.className = "inventory-cost";
        cost.textContent = this.t("action.cost", { cost: item.paCost });
        block.append(cost);
      }

      if (this.warningItemId === item.id) {
        const warning = document.createElement("div");
        warning.className = "inventory-warning";
        warning.textContent = this.t(this.itemsNode.dataset.warningKey || "ui.inventory_no_effect");
        block.append(warning);
      }

      if (this.readOnly) {
        block.classList.add("read-only");
        block.tabIndex = -1;
      } else {
        block.addEventListener("click", () => this.selectItem({ item, block, hasEnoughPa }));
      }

      const label = document.createElement("div");
      label.className = "inventory-item-name";
      label.textContent = this.t(item.nameKey);

      wrapper.append(block, label);
      this.itemsNode.append(wrapper);
    });
  }

  selectItem({ item, block, hasEnoughPa }) {
    if (!hasEnoughPa) {
      this.selectedItemId = null;
      this.showItemWarning(item.id, "ui.inventory_not_enough_pa");
      return;
    }

    if (this.selectedItemId === item.id) {
      this.selectedItemId = null;
      this.warningItemId = null;
      block.classList.remove("selected");
      return;
    }

    if (!this.isItemEffective(item)) {
      this.selectedItemId = null;
      this.showItemWarning(item.id);
      return;
    }

    this.selectedItemId = item.id;
    this.warningItemId = null;
    delete this.itemsNode.dataset.warningKey;
    this.itemsNode.querySelectorAll(".inventory-warning").forEach((warning) => warning.remove());
    this.itemsNode.querySelectorAll(".inventory-item-block.selected").forEach((selectedBlock) => {
      selectedBlock.classList.remove("selected");
    });
    block.classList.add("selected");
  }

  renderHeader() {
    const { heroHpLabel, heroHpText, heroHpBar, goldText, starsText, gemsText } = this.headerNodes;
    const hero = this.getHeroStatus() ?? {};
    const maxHp = Math.max(1, hero.maxHp ?? 1);
    const hp = Math.max(0, Math.min(maxHp, hero.hp ?? maxHp));
    if (heroHpLabel) heroHpLabel.textContent = this.getHeroName() ?? this.t("ui.hero");
    if (heroHpText) heroHpText.textContent = this.t("ui.hp", { current: hp, max: maxHp });
    if (heroHpBar) heroHpBar.style.width = `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%`;

    const currencies = this.getCurrencies() ?? {};
    if (goldText) goldText.textContent = currencies.gold ?? 0;
    if (starsText) starsText.textContent = currencies.stars ?? 0;
    if (gemsText) gemsText.textContent = currencies.gems ?? 0;
  }
}
