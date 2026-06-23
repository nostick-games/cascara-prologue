import { itemDefinitions } from "../data/items.js";
import { assetPath } from "../utils/assetPath.js";
import { nativeHaptic } from "../utils/nativeBridge.js";

const goldIconSrc = assetPath("assets/inventaire/or.png");
const maxQuantityWheelItems = 5;

function clampIndex(index, length) {
  return (index + length) % length;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export class MapShopFlow {
  constructor({
    t,
    getGold,
    setGold,
    addInventoryItem,
    getInventoryQuantity = () => 0,
    render = () => {}
  }) {
    this.t = t;
    this.getGold = getGold;
    this.setGold = setGold;
    this.addInventoryItem = addInventoryItem;
    this.getInventoryQuantity = getInventoryQuantity;
    this.render = render;
    this.goldCounter = null;
    this.goldValueNode = null;
  }

  async run(shop, host, { speaker }) {
    this.host = host;
    this.shop = shop;
    this.speaker = speaker;
    this.ensureGoldCounter();
    this.setShopActive(true);
    this.showGoldCounter();

    try {
      let keepShopping = true;
      let boughtSomething = false;
      while (keepShopping) {
        const messageKey = boughtSomething && shop.thanksKey ? shop.thanksKey : shop.introKey;
        const choice = await host.playChoiceDialog({
          message: `${speaker} : ${this.t(messageKey, { hero: host.heroName })}`,
          options: [
            { label: this.t(shop.optionBrowseKey), value: "browse" },
            { label: this.t(shop.optionExitKey), value: "exit" }
          ],
          messageHighlights: [speaker, host.heroName],
          optionLayout: "vertical",
          autoHide: false
        });

        if (choice !== "browse") {
          keepShopping = false;
          break;
        }
        const result = await this.browseItems();
        boughtSomething = result === "bought";
        keepShopping = result === "intro" || result === "bought";
      }
    } finally {
      this.setShopActive(false);
      this.hideGoldCounter();
      host.hideDialog();
      host.hideMapChoicePanel();
    }
  }

  async browseItems() {
    while (true) {
      this.host.hideDialog();
      const selectedItemId = await this.host.activateMapChoicePanel(
        this.shop.items.map((entry) => {
          const item = itemDefinitions[entry.itemId];
          return {
            label: this.t(item.nameKey),
            value: entry.itemId,
            price: entry.price,
            iconSrc: goldIconSrc
          };
        }),
        { cancelOnOutside: true }
      );
      if (!selectedItemId) return "exit";

      const shopEntry = this.shop.items.find((entry) => entry.itemId === selectedItemId);
      const item = itemDefinitions[selectedItemId];
      const next = await this.showItemDetails(item, shopEntry);
      if (next === "quantity") {
        const bought = await this.showQuantityPicker(item, shopEntry);
        if (bought) return "bought";
        return "intro";
      }
      if (next === "more") continue;
      return "intro";
    }
  }

  async showItemDetails(item, shopEntry) {
    return this.host.playChoiceDialog({
      message: `${this.t(item.nameKey)} : ${this.t(shopEntry.descriptionKey)}`,
      options: [
        { label: this.t(this.shop.optionQuantityKey), value: "quantity" },
        { label: this.t(this.shop.optionMoreKey), value: "more" },
        { label: this.t(this.shop.optionCancelKey), value: "cancel" }
      ],
      messageHighlights: [this.t(item.nameKey)],
      optionLayout: "vertical",
      autoHide: false
    });
  }

  async showQuantityPicker(item, shopEntry) {
    const itemName = this.t(item.nameKey);
    await this.host.showDialog({
      message: `${this.speaker} : ${this.t(this.shop.quantityPromptKey, {
        item: itemName,
        quantity: this.getInventoryQuantity(item.id)
      })}`,
      prompt: "",
      messageHighlights: [this.speaker, itemName]
    });
    const quantity = await this.activateQuantityWheel({
      price: shopEntry.price,
      cancelLabel: this.t(this.shop.optionCancelKey)
    });
    if (!quantity) return false;
    await this.buyItem(item, shopEntry, quantity);
    return true;
  }

  activateQuantityWheel({ price, cancelLabel }) {
    const { mapDialogLog } = this.host.nodes;
    if (!mapDialogLog) return Promise.resolve(null);

    const affordable = Math.floor(this.getGold() / price);
    const maxQuantity = Math.min(maxQuantityWheelItems, Math.max(0, affordable));
    const quantities = maxQuantity > 0 ? Array.from({ length: maxQuantity }, (_, index) => index + 1) : [1];
    const wheel = document.createElement("div");
    wheel.className = "map-shop-quantity";
    const quantityList = document.createElement("div");
    quantityList.className = "map-shop-quantity-wheel";
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "map-dialog-option map-shop-cancel-option";
    cancelButton.innerHTML = `<span class="map-dialog-option-marker"></span><span class="map-dialog-option-label">${cancelLabel}</span>`;
    wheel.append(quantityList, cancelButton);
    mapDialogLog.append(wheel);
    mapDialogLog.scrollTop = mapDialogLog.scrollHeight;

    return new Promise((resolve) => {
      let selectedIndex = maxQuantity > 0 ? 0 : quantities.length;
      let resolved = false;
      let buttons = [];
      const focusableCount = quantities.length + 1;
      const cleanup = () => {
        window.removeEventListener("keydown", handleKeyDown, true);
        buttons.forEach((button) => button.removeEventListener("pointerdown", handlePointerDown));
        cancelButton.removeEventListener("pointerdown", handlePointerDown);
      };
      const confirm = () => {
        if (resolved) return;
        if (selectedIndex < quantities.length && maxQuantity <= 0) return;
        resolved = true;
        nativeHaptic("medium");
        cleanup();
        resolve(selectedIndex < quantities.length ? quantities[selectedIndex] : null);
      };
      const select = (nextIndex) => {
        const normalizedIndex = clampIndex(nextIndex, focusableCount);
        if (normalizedIndex !== selectedIndex) nativeHaptic("light");
        selectedIndex = normalizedIndex;
        render();
      };
      const handleKeyDown = (event) => {
        if (event.repeat) return;
        if (["ArrowLeft", "ArrowUp"].includes(event.code)) {
          event.preventDefault();
          event.stopPropagation();
          select(selectedIndex - 1);
          return;
        }
        if (["ArrowRight", "ArrowDown"].includes(event.code)) {
          event.preventDefault();
          event.stopPropagation();
          select(selectedIndex + 1);
          return;
        }
        if (["Enter", "Space"].includes(event.code)) {
          event.preventDefault();
          event.stopPropagation();
          confirm();
        }
      };
      const handlePointerDown = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const nextIndex = Number(event.currentTarget.dataset.choiceIndex);
        if (selectedIndex !== nextIndex) {
          selectedIndex = nextIndex;
          nativeHaptic("light");
          render();
          return;
        }
        confirm();
      };
      const render = () => {
        quantityList.innerHTML = "";
        buttons = quantities.map((quantity, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "map-shop-quantity-option";
          button.classList.toggle("is-selected", index === selectedIndex);
          button.classList.toggle("is-disabled", maxQuantity <= 0);
          button.dataset.choiceIndex = String(index);
          button.textContent = String(quantity);
          button.addEventListener("pointerdown", handlePointerDown);
          quantityList.append(button);
          return button;
        });
        cancelButton.dataset.choiceIndex = String(quantities.length);
        cancelButton.classList.toggle("is-selected", selectedIndex === quantities.length);
        cancelButton.querySelector(".map-dialog-option-marker").textContent = selectedIndex === quantities.length ? "▶︎" : "";
      };
      render();
      cancelButton.addEventListener("pointerdown", handlePointerDown);
      window.setTimeout(() => window.addEventListener("keydown", handleKeyDown, true), 180);
    });
  }

  async buyItem(item, shopEntry, quantity) {
    this.addInventoryItem(item.id, quantity);
    const total = shopEntry.price * quantity;
    for (let index = 0; index < total; index += 1) {
      this.setGold(Math.max(0, this.getGold() - 1));
      this.updateGoldCounter();
      this.render();
      await wait(22);
    }
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

  setShopActive(active) {
    this.host?.nodes?.mapSection?.classList.toggle("is-shop-active", active);
  }
}
