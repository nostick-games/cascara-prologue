import { renderHighlightedDialogText } from "./map/mapDialogUi.js";
import { nativeHaptic } from "../utils/nativeBridge.js";

const TYPE_DELAY_MS = 12;
const SKIP_ARM_DELAY_MS = 180;
const CHOICE_FREEZE_MS = 420;

export class ChadTutorialController {
  constructor({
    overlayNode,
    dialogLog,
    rosterSlots,
    enemyRadarButton,
    enemyRadarModalClose,
    enemyRadarModalShield,
    instinctButton,
    instinctModalClose,
    instinctModalShield,
    instinctModalList,
    startCombatButton,
    humanBriefingScreen,
    t,
    heroName,
    chadName,
    onTutorialSeen = () => {}
  }) {
    this.overlayNode = overlayNode;
    this.dialogLog = dialogLog;
    this.rosterSlots = rosterSlots;
    this.enemyRadarButton = enemyRadarButton;
    this.enemyRadarModalClose = enemyRadarModalClose;
    this.enemyRadarModalShield = enemyRadarModalShield;
    this.instinctButton = instinctButton;
    this.instinctModalClose = instinctModalClose;
    this.instinctModalShield = instinctModalShield;
    this.instinctModalList = instinctModalList;
    this.startCombatButton = startCombatButton;
    this.humanBriefingScreen = humanBriefingScreen;
    this.t = t;
    this.heroName = heroName;
    this.chadName = chadName;
    this.onTutorialSeen = onTutorialSeen;
    this._highlightedButtons = [];
    this._typingToken = 0;
  }

  get highlights() {
    return [this.chadName, this.heroName].filter(Boolean);
  }

  showOverlay() {
    this.overlayNode.hidden = false;
    this.overlayNode.classList.add("is-blocking");
    this._overlayClickHandler = (e) => {
      const highlighted = this._highlightedButtons[0];
      if (!highlighted) return;
      const rect = highlighted.getBoundingClientRect();
      if (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      ) {
        highlighted.click();
      }
    };
    this.overlayNode.addEventListener("click", this._overlayClickHandler);
  }

  hideOverlay() {
    this.overlayNode.hidden = true;
    this.overlayNode.classList.remove("is-blocking");
    if (this._overlayClickHandler) {
      this.overlayNode.removeEventListener("click", this._overlayClickHandler);
      this._overlayClickHandler = null;
    }
    this._highlightedButtons.forEach((b) => b.classList.remove("is-tutorial-target"));
    this._highlightedButtons = [];
  }

  pauseBlocking() {
    this.overlayNode.classList.remove("is-blocking");
  }

  resumeBlocking() {
    this.overlayNode.classList.add("is-blocking");
  }

  typeMessage(message) {
    const token = ++this._typingToken;
    this.dialogLog.parentElement.hidden = false;
    this.dialogLog.innerHTML = "";
    const p = document.createElement("p");
    this.dialogLog.appendChild(p);

    return new Promise((resolve) => {
      let index = 0;
      let canSkip = false;
      let resolved = false;
      const h = this.highlights;

      const cleanup = () => {
        this.overlayNode.removeEventListener("click", skipHandler);
        document.removeEventListener("keydown", skipHandler);
      };

      const complete = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        renderHighlightedDialogText(p, message, h);
        resolve();
      };

      const skipHandler = () => {
        if (!canSkip) return;
        if (this._typingToken !== token) return;
        this._typingToken++;
        complete();
      };
      this.overlayNode.addEventListener("click", skipHandler, { once: true });
      document.addEventListener("keydown", skipHandler, { once: true });
      window.setTimeout(() => {
        if (this._typingToken === token) canSkip = true;
      }, SKIP_ARM_DELAY_MS);

      const step = () => {
        if (this._typingToken !== token) return;
        index += 1;
        renderHighlightedDialogText(p, message.slice(0, index), h);
        if (index < message.length) {
          window.setTimeout(step, TYPE_DELAY_MS);
        } else {
          complete();
        }
      };
      window.setTimeout(step, TYPE_DELAY_MS);
    });
  }

  showIndicator() {
    const p = this.dialogLog.querySelector("p");
    if (!p) return;
    const indicator = document.createElement("span");
    indicator.className = "map-dialog-continue-indicator";
    indicator.textContent = "▼";
    p.appendChild(indicator);
  }

  hideDialog() {
    this._typingToken++;
    this.dialogLog.parentElement.hidden = true;
  }

  async playDialog(message) {
    await this.typeMessage(message);
    this.showIndicator();
    await this.waitForContinue();
  }

  // Dialogue avec choix : typewriter, puis options dans le style map-dialog-option.
  async playChoiceDialog(message, options) {
    await this.typeMessage(message);

    const choiceLine = document.createElement("p");
    choiceLine.className = "map-dialog-options";
    this.dialogLog.appendChild(choiceLine);

    return new Promise((resolve) => {
      let selectedIndex = 0;
      let optionButtons = [];
      let resolved = false;

      const cleanup = () => {
        window.removeEventListener("keydown", handleKeyDown, true);
        optionButtons.forEach((button) => {
          button.removeEventListener("pointerdown", handlePointerDown);
        });
      };

      const confirm = () => {
        if (resolved) return;
        resolved = true;
        nativeHaptic("medium");
        cleanup();
        this.hideDialog();
        resolve(options[selectedIndex]?.value ?? null);
      };

      const select = (nextIndex) => {
        const normalizedIndex = (nextIndex + options.length) % options.length;
        if (normalizedIndex !== selectedIndex) nativeHaptic("light");
        selectedIndex = normalizedIndex;
        renderOptions();
      };

      const handleKeyDown = (event) => {
        if (["ArrowLeft", "ArrowUp"].includes(event.code)) {
          event.preventDefault();
          select(selectedIndex - 1);
          return;
        }
        if (["ArrowRight", "ArrowDown"].includes(event.code)) {
          event.preventDefault();
          select(selectedIndex + 1);
          return;
        }
        if (["Enter", "Space"].includes(event.code)) {
          event.preventDefault();
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
          renderOptions();
          return;
        }
        confirm();
      };

      const renderOptions = () => {
        choiceLine.innerHTML = "";
        optionButtons = options.map(({ label }, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "map-dialog-option";
          button.classList.toggle("is-selected", index === selectedIndex);
          button.dataset.choiceIndex = String(index);
          const marker = document.createElement("span");
          marker.className = "map-dialog-option-marker";
          marker.textContent = index === selectedIndex ? "▶︎" : "";
          const labelSpan = document.createElement("span");
          labelSpan.className = "map-dialog-option-label";
          labelSpan.textContent = label;
          button.append(marker, labelSpan);
          button.addEventListener("pointerdown", handlePointerDown);
          choiceLine.appendChild(button);
          return button;
        });
        this.dialogLog.scrollTop = this.dialogLog.scrollHeight;
      };

      renderOptions();
      window.addEventListener("keydown", handleKeyDown, true);
    });
  }

  waitForContinue() {
    return new Promise((resolve) => {
      const handler = () => {
        this.overlayNode.removeEventListener("click", handler);
        document.removeEventListener("keydown", handler);
        resolve();
      };
      window.setTimeout(() => {
        this.overlayNode.addEventListener("click", handler);
        document.addEventListener("keydown", handler);
      }, 200);
    });
  }

  highlightButton(button) {
    this._highlightedButtons.push(button);
    button.classList.add("is-tutorial-target");
  }

  highlightButtons(buttons) {
    buttons.forEach((b) => this.highlightButton(b));
  }

  unhighlightAll() {
    this._highlightedButtons.forEach((b) => b.classList.remove("is-tutorial-target"));
    this._highlightedButtons = [];
  }

  waitForAnyPress(elements) {
    return new Promise((resolve) => {
      let resolved = false;
      elements.forEach((el) => {
        const done = (e) => {
          if (resolved) return;
          resolved = true;
          elements.forEach((el2) => {
            el2.removeEventListener("pointerup", done);
            el2.removeEventListener("click", done);
          });
          resolve(el);
        };
        el.addEventListener("pointerup", done);
        el.addEventListener("click", done);
      });
    });
  }

  waitForPress(element) {
    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        element.removeEventListener("pointerup", done);
        element.removeEventListener("click", done);
        resolve();
      };
      element.addEventListener("pointerup", done);
      element.addEventListener("click", done);
    });
  }

  waitForSlotAssigned({ requireEntry = false } = {}) {
    return new Promise((resolve) => {
      const prev = this.humanBriefingScreen.onSlotAssigned;
      this.humanBriefingScreen.onSlotAssigned = (...args) => {
        const entryId = args[1];
        if (requireEntry && !entryId) {
          prev?.(...args);
          return;
        }
        this.humanBriefingScreen.onSlotAssigned = prev ?? null;
        prev?.(...args);
        resolve(...args);
      };
    });
  }

  setRosterModalFawnaChoiceOnly(enabled, allowedButton = null) {
    const rosterModal = this.humanBriefingScreen.rosterModal;
    const lockedButtons = [
      rosterModal.okButton,
      rosterModal.signatureButton,
      ...rosterModal.sortControls.querySelectorAll("button")
    ].filter(Boolean);
    lockedButtons.forEach((button) => {
      button.disabled = enabled;
    });
    rosterModal.grid.querySelectorAll(".roster-cell").forEach((button) => {
      if (!enabled) {
        button.disabled = button.classList.contains("locked");
        return;
      }
      button.disabled = button !== allowedButton;
    });
  }

  firstRosterFawnaButton() {
    return this.humanBriefingScreen.rosterModal.grid.querySelector(".roster-cell:not(.locked)");
  }

  waitForRosterFawnaSelection(button) {
    const rosterModal = this.humanBriefingScreen.rosterModal;
    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        window.setTimeout(() => {
          if (resolved) return;
          const entryId = rosterModal.pendingSelection;
          const slotIndex = rosterModal.slotIndex;
          if (!entryId || slotIndex === null) return;
          resolved = true;
          button.removeEventListener("click", done);
          this.hideDialog();
          this.humanBriefingScreen.assignTeamSlot(slotIndex, entryId);
          resolve(entryId);
        }, 0);
      };
      button.addEventListener("click", done);
    });
  }

  waitForRosterModalInteraction() {
    const shield = this.humanBriefingScreen.rosterModal.shield;
    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        shield.removeEventListener("pointerdown", done, true);
        shield.removeEventListener("keydown", done, true);
        this.hideDialog();
        resolve();
      };
      shield.addEventListener("pointerdown", done, true);
      shield.addEventListener("keydown", done, true);
    });
  }

  waitForRosterModalOpen() {
    const shield = this.humanBriefingScreen.rosterModal.shield;
    if (!shield.hidden) return Promise.resolve();
    return new Promise((resolve) => {
      const obs = new MutationObserver(() => {
        if (!shield.hidden) {
          obs.disconnect();
          resolve();
        }
      });
      obs.observe(shield, { attributes: true, attributeFilter: ["hidden"] });
    });
  }

  waitForRosterModalClose() {
    const shield = this.humanBriefingScreen.rosterModal.shield;
    if (shield.hidden) return Promise.resolve();
    return new Promise((resolve) => {
      const obs = new MutationObserver(() => {
        if (shield.hidden) {
          obs.disconnect();
          resolve();
        }
      });
      obs.observe(shield, { attributes: true, attributeFilter: ["hidden"] });
    });
  }

  waitForModalClose(closeButton, shieldButton = null) {
    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        closeButton.removeEventListener("click", done);
        shieldButton?.removeEventListener("click", done);
        resolve();
      };
      closeButton.addEventListener("click", done);
      shieldButton?.addEventListener("click", done);
    });
  }

  // Attend que l'écran instinct se ferme (depuis l'intérieur de la modale).
  waitForInstinctModalClose() {
    const shield = this.instinctModalShield;
    if (shield.hidden) return Promise.resolve();
    return new Promise((resolve) => {
      const obs = new MutationObserver(() => {
        if (shield.hidden) {
          obs.disconnect();
          resolve();
        }
      });
      obs.observe(shield, { attributes: true, attributeFilter: ["hidden"] });
    });
  }

  waitForInstinctModalOpen() {
    const shield = this.instinctModalShield;
    if (!shield.hidden) return Promise.resolve();
    return new Promise((resolve) => {
      const obs = new MutationObserver(() => {
        if (!shield.hidden) {
          obs.disconnect();
          resolve();
        }
      });
      obs.observe(shield, { attributes: true, attributeFilter: ["hidden"] });
    });
  }

  // Attend que la première entrée de la liste d'instincts soit sélectionnée.
  waitForFirstInstinctSelected() {
    return new Promise((resolve) => {
      const firstRow = this.instinctModalList.querySelector(".affix-row");
      if (!firstRow) { resolve(); return; }

      // Highlight visuel sur la première ligne
      firstRow.classList.add("is-tutorial-target");

      const checkbox = firstRow.querySelector("input[type=checkbox]");
      if (!checkbox) { firstRow.classList.remove("is-tutorial-target"); resolve(); return; }

      const handler = () => {
        firstRow.classList.remove("is-tutorial-target");
        resolve();
      };
      checkbox.addEventListener("change", handler, { once: true });
      firstRow.addEventListener("click", handler, { once: true });
    });
  }

  wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async start() {
    const { t, chadName, heroName } = this;
    const ownedCount = this.humanBriefingScreen.ownedCreatureCount?.() ?? 0;

    await this.wait(600);
    this.showOverlay();

    // Choix initial
    const choice = await this.playChoiceDialog(
      t("tuto.chad.intro_prompt"),
      [
        { label: t("tuto.chad.intro_ok"), value: "yes" },
        { label: t("tuto.chad.intro_no"), value: "no" }
      ]
    );
    this.onTutorialSeen();
    await this.wait(CHOICE_FREEZE_MS);
    if (choice === "no") {
      this.hideOverlay();
      return;
    }

    if (ownedCount >= 2) {
      await this.runScenario2();
    } else {
      await this.runScenario1();
    }
  }

  async runScenario1() {
    const { t, chadName, heroName } = this;

    // --- Intro ---
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.1", { hero: heroName })}`);
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.2")}`);

    // --- Roster slots ---
    this.hideDialog();
    this.highlightButtons(this.rosterSlots);

    // Quand le joueur appuie sur un slot, le modal de sélection s'ouvre
    await this.waitForAnyPress(this.rosterSlots);
    this.unhighlightAll();

    // Le modal est ouvert : afficher la consigne, puis laisser la modale interactive.
    await this.typeMessage(`${chadName} : ${t("tuto.chad.s1.3")}`);
    this.showIndicator();
    await this.waitForContinue();
    this.hideDialog();
    const firstFawnaButton = this.firstRosterFawnaButton();
    this.setRosterModalFawnaChoiceOnly(true, firstFawnaButton);
    this.highlightButton(firstFawnaButton);
    await this.waitForRosterFawnaSelection(firstFawnaButton);
    this.unhighlightAll();
    this.setRosterModalFawnaChoiceOnly(false);

    // --- Dialogue post-sélection fawna ---
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.4")}`);
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.5")}`);

    // --- Signature ---
    this.hideDialog();
    this.highlightButtons(this.rosterSlots);

    // Attendre que le joueur rouvre un slot et ouvre le modal roster
    this.pauseBlocking();
    await this.waitForRosterModalOpen();
    this.unhighlightAll();

    // Mettre le liseré sur le bouton Signature (dans le roster modal)
    const signatureButton = this.humanBriefingScreen.rosterModal.signatureButton;
    if (signatureButton) {
      signatureButton.classList.add("is-tutorial-target");
      const signatureModalOpened = this.waitForInstinctModalOpen();
      await this.waitForPress(signatureButton);
      await signatureModalOpened;
      signatureButton.classList.remove("is-tutorial-target");
    }

    // Modal signature ouverte (instinctModal) — dialoguer
    this.resumeBlocking();
    await this.wait(600);
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.6")}`);
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.7")}`);
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.8")}`);

    // Attendre que le joueur ferme la signature et le roster
    this.hideDialog();
    this.pauseBlocking();
    await this.waitForInstinctModalClose();
    await this.waitForRosterModalClose();
    this.resumeBlocking();

    // --- Talents ennemis ---
    this.highlightButton(this.enemyRadarButton);

    await this.waitForPress(this.enemyRadarButton);
    this.unhighlightAll();

    await this.wait(600);
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.9")}`);
    this.hideDialog();

    // Attendre que le joueur ferme la modale talents
    this.pauseBlocking();
    await this.waitForModalClose(this.enemyRadarModalClose, this.enemyRadarModalShield);
    this.resumeBlocking();

    // --- Instinct ---
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.10")}`);
    this.hideDialog();
    this.highlightButton(this.instinctButton);

    await this.waitForPress(this.instinctButton);
    this.unhighlightAll();

    // Modal instinct ouverte
    await this.wait(600);
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.11")}`);
    this.hideDialog();

    // Laisser le joueur sélectionner le premier instinct
    this.pauseBlocking();
    await this.waitForFirstInstinctSelected();
    await this.waitForInstinctModalClose();
    this.resumeBlocking();

    // --- Combat ---
    await this.playDialog(`${chadName} : ${t("tuto.chad.s1.12")}`);
    this.hideDialog();
    this.highlightButton(this.startCombatButton);

    await this.waitForPress(this.startCombatButton);
    this.unhighlightAll();
    this.hideOverlay();
  }

  async runScenario2() {
    // À implémenter ultérieurement.
    this.hideOverlay();
  }
}
