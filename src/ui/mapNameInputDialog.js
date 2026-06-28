export function playNameInputDialog({ frame, prompt, input, okButton, defaultName, t }) {
  return new Promise((resolve) => {
    prompt.textContent = t("map.name_input.prompt");
    okButton.textContent = t("map.name_input.ok");
    input.value = defaultName;
    frame.hidden = false;

    // Sélectionne tout le texte pour faciliter la saisie
    requestAnimationFrame(() => {
      input.focus();
      input.select();
    });

    function confirm() {
      const name = input.value.trim() || defaultName;
      frame.hidden = true;
      okButton.removeEventListener("click", confirm);
      input.removeEventListener("keydown", onKey);
      resolve(name);
    }

    function onKey(e) {
      if (e.key === "Enter") confirm();
    }

    okButton.addEventListener("click", confirm);
    input.addEventListener("keydown", onKey);
  });
}
