import { renderHighlightedDialogText } from "./map/mapDialogUi.js";

const TYPE_DELAY_MS = 12;

export class TutorialBriefingController {
  constructor({
    overlayNode,
    dialogLog,
    behaviorButton,
    captureConditionsButton,
    startCaptureButton,
    briefingModalClose,
    t,
    heroName,
    flamillonName
  }) {
    this.overlayNode = overlayNode;
    this.dialogLog = dialogLog;
    this.behaviorButton = behaviorButton;
    this.captureConditionsButton = captureConditionsButton;
    this.startCaptureButton = startCaptureButton;
    this.briefingModalClose = briefingModalClose;
    this.t = t;
    this.heroName = heroName;
    this.flamillonName = flamillonName;
    this._highlightedButton = null;
    this._typingToken = 0;
  }

  get highlights() {
    return [
      this.t("map.npc.nora.name"),
      this.heroName,
      this.flamillonName
    ].filter(Boolean);
  }

  showOverlay() {
    this.overlayNode.hidden = false;
    this.overlayNode.classList.add("is-blocking");
    this._overlayClickHandler = (e) => {
      if (!this._highlightedButton) return;
      const rect = this._highlightedButton.getBoundingClientRect();
      if (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      ) {
        this._highlightedButton.click();
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
  }

  // Affiche le texte lettre par lettre. Un clic pendant le typage complète immédiatement.
  // Retourne une promesse qui se résout quand le typage est terminé.
  typeMessage(message) {
    const token = ++this._typingToken;
    this.dialogLog.parentElement.hidden = false;
    this.dialogLog.innerHTML = "";
    const p = document.createElement("p");
    this.dialogLog.appendChild(p);

    return new Promise((resolve) => {
      let index = 0;
      const h = this.highlights;

      const complete = () => {
        renderHighlightedDialogText(p, message, h);
        resolve();
      };

      // Clic pendant le typage → texte complet immédiat
      const skipHandler = () => {
        if (this._typingToken !== token) return;
        this._typingToken++; // invalide le step courant
        complete();
      };
      this.overlayNode.addEventListener("click", skipHandler, { once: true });
      document.addEventListener("keydown", skipHandler, { once: true });

      const step = () => {
        if (this._typingToken !== token) return; // annulé par skip
        index += 1;
        renderHighlightedDialogText(p, message.slice(0, index), h);
        if (index < message.length) {
          window.setTimeout(step, TYPE_DELAY_MS);
        } else {
          this.overlayNode.removeEventListener("click", skipHandler);
          document.removeEventListener("keydown", skipHandler);
          resolve();
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
    this._typingToken++; // annule tout typage en cours
    this.dialogLog.parentElement.hidden = true;
  }

  // Type le message, puis attend une interaction du joueur.
  async playDialog(message) {
    await this.typeMessage(message);
    this.showIndicator();
    await this.waitForContinue();
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
    this._highlightedButton = button;
    button.classList.add("is-tutorial-target");
  }

  unhighlightButton(button) {
    button.classList.remove("is-tutorial-target");
    this._highlightedButton = null;
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

  waitForModalClose() {
    return this.waitForPress(this.briefingModalClose);
  }

  waitForButtonClick(button) {
    return this.waitForPress(button);
  }

  wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async start() {
    const { t } = this;
    const noraName = t("map.npc.nora.name");

    await this.wait(600);
    this.showOverlay();

    await this.playDialog(`${noraName} : ${t("tuto.briefing.1")}`);
    await this.playDialog(`${noraName} : ${t("tuto.briefing.2")}`);

    this.hideDialog();
    this.highlightButton(this.behaviorButton);
    await this.waitForModalClose();
    this.unhighlightButton(this.behaviorButton);

    await this.playDialog(`${noraName} : ${t("tuto.briefing.3")}`);

    this.hideDialog();
    this.highlightButton(this.captureConditionsButton);
    await this.waitForModalClose();
    this.unhighlightButton(this.captureConditionsButton);

    await this.playDialog(`${noraName} : ${t("tuto.briefing.instinct")}`);
    await this.playDialog(`${noraName} : ${t("tuto.briefing.4")}`);
    await this.playDialog(`${noraName} : ${t("tuto.briefing.5a")}`);
    await this.playDialog(`${noraName} : ${t("tuto.briefing.5b")}`);

    this.hideDialog();
    this.startCaptureButton.disabled = false;
    this.highlightButton(this.startCaptureButton);
    await this.waitForButtonClick(this.startCaptureButton);
    this.unhighlightButton(this.startCaptureButton);
    this.hideOverlay();
  }
}
