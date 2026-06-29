import { renderHighlightedDialogText } from "./map/mapDialogUi.js";
import { nativeHaptic } from "../utils/nativeBridge.js";

const TYPE_DELAY_MS = 12;
const SKIP_ARM_DELAY_MS = 180;
const CHOICE_FREEZE_MS = 420;
const MODAL_TOUCH_RELEASE_GUARD_MS = 600;
const tutorialDominantTypes = new Set(["feu", "eau", "vent"]);

export class ChadTutorialController {
  constructor({
    overlayNode,
    dialogLog,
    rosterSlots,
    enemyRadarButton,
    enemyRadarModalClose,
    enemyRadarModalShield,
    instinctButton,
    instinctModalList,
    startCombatButton,
    humanBriefingScreen,
    t,
    heroName,
    chadName,
    tutorialScenario = "auto",
    onTutorialSeen = () => {}
  }) {
    this.overlayNode = overlayNode;
    this.dialogLog = dialogLog;
    this.rosterSlots = rosterSlots;
    this.enemyRadarButton = enemyRadarButton;
    this.enemyRadarModalClose = enemyRadarModalClose;
    this.enemyRadarModalShield = enemyRadarModalShield;
    this.instinctButton = instinctButton;
    this.instinctModalList = instinctModalList;
    this.startCombatButton = startCombatButton;
    this.humanBriefingScreen = humanBriefingScreen;
    this.t = t;
    this.heroName = heroName;
    this.chadName = chadName;
    this.tutorialScenario = tutorialScenario;
    this.onTutorialSeen = onTutorialSeen;
    this._highlightedButtons = [];
    this._typingToken = 0;
    this._previousOnSlotAssigned = undefined;
    this._scenario2StartGuard = null;
    this._scenario2Completed = false;
    this._scenario2Completing = false;
  }

  get highlights() {
    return [this.chadName, this.heroName].filter(Boolean);
  }

  showOverlay() {
    this.overlayNode.hidden = false;
    this.overlayNode.classList.add("is-blocking");
    this._overlayClickHandler = (e) => {
      const highlighted = this._highlightedButtons.find((button) => {
        const rect = button.getBoundingClientRect();
        return (
          e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom
        );
      });
      if (!highlighted) return;
      highlighted.click();
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

  // Primitive unique : attend le premier des événements listés, résout avec l'élément déclencheur.
  // targets : tableau de [element, ...types]. armDelayMs : délai avant d'armer les écouteurs.
  waitForEvent(targets, { armDelayMs = 0 } = {}) {
    return new Promise((resolve) => {
      let resolved = false;
      const bindings = [];
      const fire = (element) => {
        if (resolved) return;
        resolved = true;
        bindings.forEach((b) => b.element.removeEventListener(b.type, b.handler));
        resolve(element);
      };
      const arm = () => {
        targets.forEach(([element, ...types]) => {
          types.forEach((type) => {
            const handler = () => fire(element);
            element.addEventListener(type, handler);
            bindings.push({ element, type, handler });
          });
        });
      };
      if (armDelayMs > 0) window.setTimeout(arm, armDelayMs);
      else arm();
    });
  }

  // Primitive unique : attend que la modale atteigne l'état voulu ("open" ou "close").
  // S'appuie sur l'émetteur de cycle de vie de la modale (plus de MutationObserver).
  waitForVisibility(visibility, state) {
    const target = state === "open";
    if (visibility.isOpen === target) return Promise.resolve();
    return new Promise((resolve) => {
      const off = state === "open"
        ? visibility.onOpen(fire)
        : visibility.onClose(fire);
      function fire() {
        off();
        resolve();
      }
    });
  }

  waitForContinue() {
    return this.waitForEvent(
      [[this.overlayNode, "click"], [document, "keydown"]],
      { armDelayMs: 200 }
    );
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
    return this.waitForEvent(elements.map((el) => [el, "pointerup", "click"]));
  }

  waitForPress(element) {
    return this.waitForEvent([[element, "pointerup", "click"]]);
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

  waitForRosterModalOpen() {
    return this.waitForVisibility(this.humanBriefingScreen.rosterModal.visibility, "open");
  }

  waitForRosterModalClose() {
    return this.waitForVisibility(this.humanBriefingScreen.rosterModal.visibility, "close");
  }

  waitForModalClose(closeButton, shieldButton = null) {
    const targets = [[closeButton, "click"]];
    if (shieldButton) targets.push([shieldButton, "click"]);
    return this.waitForEvent(targets);
  }

  waitForInstinctModalClose() {
    return this.waitForVisibility(this.humanBriefingScreen.instinctModal.visibility, "close");
  }

  waitForInstinctModalOpen() {
    return this.waitForVisibility(this.humanBriefingScreen.instinctModal.visibility, "open");
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
    const duplicatedType = this.firstOwnedDuplicateType();

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
    await this.wait(CHOICE_FREEZE_MS);
    if (choice === "no") {
      this.onTutorialSeen({ choice, scenario: this.tutorialScenario });
      this.hideOverlay();
      return;
    }

    if (this.tutorialScenario === "first") {
      await this.runScenario1();
      this.onTutorialSeen({ choice, scenario: "first", completed: true });
      return;
    }

    if (this.tutorialScenario === "type") {
      if (duplicatedType) {
        await this.runScenario2(duplicatedType);
      } else {
        this.hideOverlay();
      }
      return;
    }

    if (duplicatedType) {
      await this.runScenario2(duplicatedType);
    } else {
      await this.runScenario1();
      this.onTutorialSeen({ choice, scenario: "first", completed: true });
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

  ownedCreatureTypeCounts() {
    return this.humanBriefingScreen.getOwnedCreatures()
      .reduce((counts, { creature }) => {
        if (!tutorialDominantTypes.has(creature?.type)) return counts;
        counts.set(creature.type, (counts.get(creature.type) ?? 0) + 1);
        return counts;
      }, new Map());
  }

  firstOwnedDuplicateType() {
    const counts = this.ownedCreatureTypeCounts();
    return [...counts.entries()].find(([, count]) => count >= 2)?.[0] ?? null;
  }

  sameTypeEquippedTeam() {
    const equipped = this.humanBriefingScreen.equippedCreatures();
    const counts = equipped.reduce((map, entry) => {
      if (!entry?.type) return map;
      map.set(entry.type, (map.get(entry.type) ?? 0) + 1);
      return map;
    }, new Map());
    const type = [...counts.entries()].find(([, count]) => count >= 2)?.[0] ?? null;
    return type ? { type, count: counts.get(type) } : null;
  }

  typeLabel(type) {
    return this.t(`affix.type.${type}`);
  }

  installScenario2SlotWatcher() {
    if (this._previousOnSlotAssigned !== undefined) return;
    this._previousOnSlotAssigned = this.humanBriefingScreen.onSlotAssigned ?? null;
    this.humanBriefingScreen.onSlotAssigned = (slotIndex, entryId) => {
      this._previousOnSlotAssigned?.(slotIndex, entryId);
      if (this._scenario2Completed || this._scenario2Completing) return;
      if (!this.sameTypeEquippedTeam()) return;
      window.setTimeout(() => this.completeScenario2IfReady(), 0);
    };
  }

  uninstallScenario2SlotWatcher() {
    if (this._previousOnSlotAssigned === undefined) return;
    this.humanBriefingScreen.onSlotAssigned = this._previousOnSlotAssigned;
    this._previousOnSlotAssigned = undefined;
  }

  installScenario2StartGuard() {
    if (this._scenario2StartGuard) return;
    this._scenario2StartGuard = async (event) => {
      if (this._scenario2Completed) return;
      if (this.sameTypeEquippedTeam()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        await this.completeScenario2IfReady();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      this.showOverlay();
      await this.playDialog(`${this.chadName} : ${this.t("tuto.chad.s2.reminder")}`);
      this.hideDialog();
      this.hideOverlay();
    };
    this.startCombatButton.addEventListener("click", this._scenario2StartGuard, true);
  }

  uninstallScenario2StartGuard() {
    if (!this._scenario2StartGuard) return;
    this.startCombatButton.removeEventListener("click", this._scenario2StartGuard, true);
    this._scenario2StartGuard = null;
  }

  async completeScenario2IfReady() {
    const match = this.sameTypeEquippedTeam();
    if (!match || this._scenario2Completed || this._scenario2Completing) return false;
    this._scenario2Completing = true;
    this.uninstallScenario2StartGuard();
    this.showOverlay();
    await this.playDialog(`${this.chadName} : ${this.t("tuto.chad.s2.success_1", { type: this.typeLabel(match.type) })}`);
    await this.playDialog(`${this.chadName} : ${this.t("tuto.chad.s2.success_2")}`);
    await this.playDialog(`${this.chadName} : ${this.t("tuto.chad.s2.success_3")}`);
    this.hideDialog();
    this.hideOverlay();
    this.uninstallScenario2SlotWatcher();
    this._scenario2Completed = true;
    this._scenario2Completing = false;
    this.onTutorialSeen({ scenario: "type", completed: true });
    return true;
  }

  async runScenario2(duplicatedType) {
    const { t, chadName } = this;

    this.installScenario2SlotWatcher();
    await this.playDialog(`${chadName} : ${t("tuto.chad.s2.1", { type: this.typeLabel(duplicatedType) })}`);

    this.hideDialog();
    this.highlightButtons(this.rosterSlots);
    await this.waitForAnyPress(this.rosterSlots);
    this.unhighlightAll();

    await this.waitForRosterModalOpen();
    await this.wait(600);
    await this.playDialog(`${chadName} : ${t("tuto.chad.s2.2")}`);
    this.hideDialog();
    await this.wait(MODAL_TOUCH_RELEASE_GUARD_MS);
    this.hideOverlay();

    await this.waitForRosterModalClose();

    if (await this.completeScenario2IfReady()) return;

    this.installScenario2StartGuard();
  }
}
