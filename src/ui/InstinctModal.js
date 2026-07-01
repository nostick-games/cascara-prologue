import { setPixelButtonLabel } from "./PixelButton.js";
import { renderInstinctList } from "./instinctList.js";
import { createVisibilityEmitter } from "./visibilityEmitter.js";

// Modale de sélection d'un instinct (affixe), réutilisable.
export class InstinctModal {
  constructor({
    shield,
    modal,
    title,
    prompt,
    list,
    closeButton,
    t,
    getAffixes,
    getSelectedId,
    onSelect,
    getEmptyText,
    promptKey = "ui.hunt_affix_prompt"
  }) {
    this.shield = shield;
    this.modal = modal;
    this.title = title;
    this.prompt = prompt;
    this.list = list;
    this.closeButton = closeButton;
    this.t = t;
    this.getAffixes = getAffixes;
    this.getSelectedId = getSelectedId;
    this.onSelect = onSelect;
    this.getEmptyText = getEmptyText;
    this.promptKey = promptKey;
    this.visibility = createVisibilityEmitter();

    this.closeButton.addEventListener("click", () => this.close());
  }

  open() {
    this.render();
    this.shield.hidden = false;
    this.modal.hidden = false;
    this.resetScroll();
    this.visibility.emitOpen();
  }

  close() {
    this.modal.hidden = true;
    this.shield.hidden = true;
    this.modal.classList.remove("signature-modal-active");
    this.list.classList.remove("signature-sequence-list");
    this.visibility.emitClose();
  }

  render(scrollTop = 0) {
    this.modal.classList.remove("signature-modal-active");
    this.list.classList.remove("signature-plain-list", "signature-sequence-list");
    this.title.textContent = this.t("ui.affix_title");
    this.prompt.textContent = this.t(this.promptKey);
    setPixelButtonLabel(this.closeButton, this.t("ui.ok"));

    renderInstinctList(this.list, {
      affixes: this.getAffixes(),
      selectedId: this.getSelectedId(),
      t: this.t,
      emptyText: this.getEmptyText(),
      scrollTop,
      onChange: (newId, currentScrollTop) => {
        this.onSelect(newId);
        this.render(currentScrollTop);
      }
    });
  }

  resetScroll() {
    this.list.scrollTop = 0;
    this.modal.scrollTop = 0;
    this.modal.querySelector(".pixel-modal-content")?.scrollTo?.({ top: 0 });
    requestAnimationFrame(() => {
      this.list.scrollTop = 0;
      this.modal.scrollTop = 0;
      this.modal.querySelector(".pixel-modal-content")?.scrollTo?.({ top: 0 });
    });
  }
}
