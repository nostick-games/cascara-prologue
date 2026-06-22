import { huntAffixLevel } from "../game/affixEffects.js";

// Rendu partagé de la liste d'instincts (affixes) possédés, avec sélection unique.
// Utilisé par le briefing chasse et la modale Instinct du briefing humain.
export function renderInstinctList(container, { affixes, selectedId, t, onChange, emptyText, scrollTop = 0 }) {
  container.innerHTML = "";

  if (!affixes || affixes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "objective hidden";
    empty.textContent = emptyText;
    container.append(empty);
    return;
  }

  const dropdown = document.createElement("div");
  dropdown.className = "affix-dropdown";

  affixes.forEach((affix) => {
    const checked = selectedId === affix.id;
    const disabled = Boolean(selectedId) && !checked;
    const row = document.createElement("label");
    row.className = `affix-row${disabled ? " disabled" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    checkbox.disabled = disabled;
    checkbox.addEventListener("change", () => {
      onChange(checkbox.checked ? affix.id : null, dropdown.scrollTop);
    });

    const content = document.createElement("span");
    const title = document.createElement("strong");
    const name = document.createElement("span");
    name.textContent = t(affix.nameKey);
    const level = document.createElement("span");
    level.className = "affix-level";
    level.textContent = huntAffixLevel(t, affix);
    const type = document.createElement("span");
    type.className = "affix-type";
    type.textContent = t(`affix.type.${affix.type}`);
    title.append(name, level, type);
    const description = document.createElement("small");
    description.textContent = t(affix.descriptionKey);
    content.append(title, description);

    row.append(checkbox, content);
    dropdown.append(row);
  });

  container.append(dropdown);
  dropdown.scrollTop = scrollTop;
}
