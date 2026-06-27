import {
  mapDialogLinePauseMs,
  mapDialogTypeDelayMs
} from "./mapConfig.js";
import { assetPath } from "../../utils/assetPath.js";
import { nativeHaptic } from "../../utils/nativeBridge.js";

export function isMapChoiceScrollControlTarget(target) {
  return target instanceof Element && Boolean(target.closest(".map-choice-scroll-controls, .map-choice-scroll-button"));
}

export function showDialog(host, { message, prompt, messageHighlights = [], promptHighlights = [], showContinueIndicator = false }) {
  const { mapDialogFrame, mapDialogLog } = host.nodes;
  if (!mapDialogFrame || !mapDialogLog) return Promise.resolve();
  const token = host.dialogTypingToken + 1;
  host.dialogTypingToken = token;
  mapDialogLog.innerHTML = "";
  mapDialogFrame.hidden = false;
  return new Promise((resolve) => {
    typeDialogLines(
      host,
      [message, prompt].filter(Boolean).map((text, index) => ({
        text,
        className: index === 1 ? "map-dialog-prompt" : "",
        highlights: index === 1 ? promptHighlights : messageHighlights
      })),
      token,
      resolve,
      0,
      showContinueIndicator
    );
  });
}

export function showChoiceDialog(host, { message, prompt, options, messageHighlights = [], promptHighlights = [], optionLayout = "horizontal" }) {
  return showDialog(host, {
    message,
    prompt,
    messageHighlights,
    promptHighlights
  }).then(() => activateDialogChoice(host, options, { layout: optionLayout }));
}

export async function playMessageDialog(host, {
  message,
  messageHighlights = [],
  promptHighlights = [],
  autoHide = true,
  continueDelayMs = 160
}) {
  await showDialog(host, {
    message,
    messageHighlights,
    promptHighlights,
    showContinueIndicator: true
  });
  await waitForDialogContinue(host, continueDelayMs);
  if (autoHide) hideDialog(host);
}

export async function playChoiceDialog(host, {
  message,
  prompt,
  options,
  messageHighlights = [],
  promptHighlights = [],
  optionLayout = "horizontal",
  autoHide = true
}) {
  const choice = await showChoiceDialog(host, {
    message,
    prompt,
    options,
    messageHighlights,
    promptHighlights,
    optionLayout
  });
  if (autoHide) hideDialog(host);
  return choice;
}

export function waitForDialogContinue(host, delayMs = 160) {
  const eventName = host.isMobile() ? "pointerdown" : "keydown";
  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.repeat) return;
      event.preventDefault?.();
      event.stopPropagation?.();
      window.removeEventListener(eventName, handler, true);
      resolve();
    };
    window.setTimeout(() => {
      window.addEventListener(eventName, handler, true);
    }, delayMs);
  });
}

export function activateDialogChoice(host, options, { layout = "horizontal" } = {}) {
  const { mapDialogLog } = host.nodes;
  if (!mapDialogLog || !options?.length) return Promise.resolve(null);
  mapDialogLog.querySelectorAll(".log-cursor").forEach((cursor) => cursor.remove());

  let selectedIndex = 0;
  const choiceLine = document.createElement("p");
  choiceLine.className = `map-dialog-options ${layout === "vertical" ? "vertical" : ""}`.trim();
  mapDialogLog.append(choiceLine);
  mapDialogLog.scrollTop = mapDialogLog.scrollHeight;

  return new Promise((resolve) => {
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
      optionButtons = options.map((option, index) => {
        const button = createChoiceButton(option, index, selectedIndex, "map-dialog-option");
        button.addEventListener("pointerdown", handlePointerDown);
        choiceLine.append(button);
        return button;
      });
      mapDialogLog.scrollTop = mapDialogLog.scrollHeight;
    };

    renderOptions();
    window.addEventListener("keydown", handleKeyDown, true);
  });
}

export function activateMapChoicePanel(host, options, { cancelOnOutside = false } = {}) {
  const { mapChoicePanel, mapChoiceList } = ensureMapChoicePanel(host);
  if (!mapChoicePanel || !mapChoiceList || !options?.length) return Promise.resolve(null);
  mapChoiceList.innerHTML = "";
  mapChoicePanel.hidden = false;
  mapChoicePanel.removeAttribute("hidden");
  showMapChoiceScrollControls(host);

  let selectedIndex = 0;
  return new Promise((resolve) => {
    let optionButtons = [];
    let acceptingKeyboard = false;
    let resolved = false;
    const cleanup = () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("pointerdown", handleOutsidePointerDown, true);
      window.removeEventListener("resize", host.positionMapChoiceScrollControls);
      optionButtons.forEach((button) => {
        button.removeEventListener("pointerdown", handlePointerDown);
      });
    };
    const cancel = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      hideMapChoicePanel(host);
      resolve(null);
    };
    const confirm = () => {
      if (resolved) return;
      resolved = true;
      nativeHaptic("medium");
      cleanup();
      const value = options[selectedIndex]?.value ?? null;
      hideMapChoicePanel(host);
      resolve(value);
    };
    const select = (nextIndex) => {
      const normalizedIndex = (nextIndex + options.length) % options.length;
      if (normalizedIndex !== selectedIndex) nativeHaptic("light");
      selectedIndex = normalizedIndex;
      renderOptions();
    };
    const handleKeyDown = (event) => {
      if (!acceptingKeyboard || event.repeat) return;
      if (["ArrowUp", "ArrowLeft"].includes(event.code)) {
        event.preventDefault();
        event.stopPropagation();
        select(selectedIndex - 1);
        return;
      }
      if (["ArrowDown", "ArrowRight"].includes(event.code)) {
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
        renderOptions();
        return;
      }
      confirm();
    };
    const handleOutsidePointerDown = (event) => {
      if (!cancelOnOutside || resolved) return;
      const target = event.target;
      if (mapChoicePanel.contains(target)) return;
      if (isMapChoiceScrollControlTarget(target)) return;
      event.preventDefault();
      event.stopPropagation();
      cancel();
    };
    const renderOptions = () => {
      mapChoiceList.innerHTML = "";
      optionButtons = options.map((option, index) => {
        const button = createChoiceButton(option, index, selectedIndex, "map-dialog-option map-choice-panel-option");
        if (option.price != null) {
          const price = document.createElement("span");
          price.className = "map-choice-option-price";
          const icon = document.createElement("img");
          icon.src = option.iconSrc ?? assetPath("assets/inventaire/or.png");
          icon.alt = "";
          const amount = document.createElement("span");
          amount.textContent = String(option.price);
          price.append(icon, amount);
          button.append(price);
        }
        button.addEventListener("pointerdown", handlePointerDown);
        mapChoiceList.append(button);
        return button;
      });
      optionButtons[selectedIndex]?.scrollIntoView({ block: "nearest" });
      updateMapChoiceScrollControls(host);
    };

    renderOptions();
    window.addEventListener("resize", host.positionMapChoiceScrollControls);
    window.setTimeout(() => {
      acceptingKeyboard = true;
      window.addEventListener("keydown", handleKeyDown, true);
      if (cancelOnOutside) window.addEventListener("pointerdown", handleOutsidePointerDown, true);
    }, 180);
  });
}

export function ensureMapChoicePanel(host) {
  if (host.nodes.mapChoicePanel && host.nodes.mapChoiceList) {
    ensureMapChoiceScrollControls(host);
    return {
      mapChoicePanel: host.nodes.mapChoicePanel,
      mapChoiceList: host.nodes.mapChoiceList
    };
  }
  if (!host.nodes.mapSection) {
    return {
      mapChoicePanel: null,
      mapChoiceList: null
    };
  }
  const mapChoicePanel = document.createElement("div");
  mapChoicePanel.className = "map-choice-panel";
  mapChoicePanel.id = "mapChoicePanel";
  mapChoicePanel.hidden = true;
  const mapChoiceList = document.createElement("div");
  mapChoiceList.className = "map-choice-list";
  mapChoiceList.id = "mapChoiceList";
  mapChoicePanel.append(mapChoiceList);
  host.nodes.mapSection.append(mapChoicePanel);
  host.nodes.mapChoicePanel = mapChoicePanel;
  host.nodes.mapChoiceList = mapChoiceList;
  ensureMapChoiceScrollControls(host);
  return {
    mapChoicePanel,
    mapChoiceList
  };
}

export function ensureMapChoiceScrollControls(host) {
  if (host.nodes.mapChoiceScrollControls || !host.nodes.mapSection) return;
  const controls = document.createElement("div");
  controls.className = "map-choice-scroll-controls";
  controls.hidden = true;
  const upButton = document.createElement("button");
  upButton.type = "button";
  upButton.className = "map-choice-scroll-button";
  upButton.textContent = "▲";
  upButton.setAttribute("aria-label", "Faire défiler vers le haut");
  const downButton = document.createElement("button");
  downButton.type = "button";
  downButton.className = "map-choice-scroll-button";
  downButton.textContent = "▼";
  downButton.setAttribute("aria-label", "Faire défiler vers le bas");
  controls.append(upButton, downButton);
  host.nodes.mapSection.append(controls);
  host.nodes.mapChoiceScrollControls = controls;
  host.nodes.mapChoiceScrollUp = upButton;
  host.nodes.mapChoiceScrollDown = downButton;
  host.positionMapChoiceScrollControls = () => updateMapChoiceScrollControls(host);
  const scroll = (direction) => scrollMapChoicePanel(host, direction);
  upButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    scroll(-1);
  }, { capture: true });
  downButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    scroll(1);
  }, { capture: true });
  host.nodes.mapChoiceList?.addEventListener("scroll", () => updateMapChoiceScrollControls(host));
}

export function showMapChoiceScrollControls(host) {
  ensureMapChoiceScrollControls(host);
  if (host.nodes.mapChoiceScrollControls) host.nodes.mapChoiceScrollControls.hidden = false;
  requestAnimationFrame(() => updateMapChoiceScrollControls(host));
}

export function scrollMapChoicePanel(host, direction) {
  const list = host.nodes.mapChoiceList;
  if (!list) return;
  list.scrollBy({
    top: direction * Math.max(72, Math.round(list.clientHeight * 0.45)),
    behavior: "smooth"
  });
  window.setTimeout(() => updateMapChoiceScrollControls(host), 180);
}

export function updateMapChoiceScrollControls(host) {
  const panel = host.nodes.mapChoicePanel;
  const list = host.nodes.mapChoiceList;
  const controls = host.nodes.mapChoiceScrollControls;
  if (!panel || !list || !controls || panel.hidden) {
    if (controls) controls.hidden = true;
    return;
  }
  const mapRect = host.nodes.mapSection.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  controls.style.left = `${Math.round(panelRect.right - mapRect.left + 8)}px`;
  controls.style.top = `${Math.round(panelRect.top - mapRect.top)}px`;
  const hasOverflow = list.scrollHeight > list.clientHeight + 2;
  controls.classList.toggle("is-disabled", !hasOverflow);
  host.nodes.mapChoiceScrollUp.disabled = !hasOverflow || list.scrollTop <= 1;
  host.nodes.mapChoiceScrollDown.disabled = !hasOverflow || list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
}

export function hideDialog(host) {
  host.dialogTypingToken += 1;
  if (host.nodes.mapDialogFrame) host.nodes.mapDialogFrame.hidden = true;
  if (host.nodes.mapDialogLog) host.nodes.mapDialogLog.innerHTML = "";
}

export function hideMapChoicePanel(host) {
  if (host.nodes.mapChoicePanel) host.nodes.mapChoicePanel.hidden = true;
  if (host.nodes.mapChoiceList) host.nodes.mapChoiceList.innerHTML = "";
  if (host.nodes.mapChoiceScrollControls) host.nodes.mapChoiceScrollControls.hidden = true;
}

export function typeDialogLines(host, lines, token, onComplete, lineIndex = 0, showContinueIndicator = false) {
  if (token !== host.dialogTypingToken || !host.nodes.mapDialogLog) return;
  const line = lines[lineIndex];
  if (!line) {
    onComplete?.();
    return;
  }
  const paragraph = document.createElement("p");
  paragraph.className = line.className;
  host.nodes.mapDialogLog.append(paragraph);
  typeDialogText(host, paragraph, line.text, line.highlights, token, () => {
    if (token !== host.dialogTypingToken) return;
    const isLastLine = lineIndex >= lines.length - 1;
    const cursor = isLastLine && showContinueIndicator
      ? createDialogContinueIndicator()
      : document.createElement("span");
    if (!cursor.className) cursor.className = "log-cursor";
    paragraph.append(cursor);
    if (isLastLine) {
      onComplete?.();
      return;
    }
    window.setTimeout(() => {
      cursor.remove();
      typeDialogLines(host, lines, token, onComplete, lineIndex + 1, showContinueIndicator);
    }, mapDialogLinePauseMs);
  });
}

export function createDialogContinueIndicator() {
  const indicator = document.createElement("span");
  indicator.className = "map-dialog-continue-indicator";
  indicator.setAttribute("aria-hidden", "true");
  indicator.textContent = "▼";
  return indicator;
}

export function typeDialogText(host, target, text, highlights, token, onComplete) {
  let index = 0;
  const step = () => {
    if (token !== host.dialogTypingToken) return;
    renderHighlightedDialogText(target, text.slice(0, index), highlights);
    host.nodes.mapDialogLog.scrollTop = host.nodes.mapDialogLog.scrollHeight;
    index += 1;
    if (index <= text.length) {
      window.setTimeout(step, mapDialogTypeDelayMs);
      return;
    }
    onComplete();
  };
  step();
}

export function renderHighlightedDialogText(target, text, highlights = []) {
  const validHighlights = highlights.filter(Boolean);
  if (!validHighlights.length) {
    target.textContent = text;
    return;
  }

  target.textContent = "";
  let cursor = 0;
  while (cursor < text.length) {
    const match = validHighlights
      .map((highlight) => ({
        highlight,
        index: text.indexOf(highlight, cursor)
      }))
      .filter((entry) => entry.index >= 0)
      .sort((a, b) => a.index - b.index || b.highlight.length - a.highlight.length)[0];

    if (!match) {
      target.append(document.createTextNode(text.slice(cursor)));
      break;
    }
    if (match.index > cursor) {
      target.append(document.createTextNode(text.slice(cursor, match.index)));
    }
    const span = document.createElement("span");
    span.className = "map-dialog-enemy-name";
    span.textContent = text.slice(match.index, match.index + match.highlight.length);
    target.append(span);
    cursor = match.index + match.highlight.length;
  }
}

function createChoiceButton(option, index, selectedIndex, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.classList.toggle("is-selected", index === selectedIndex);
  button.dataset.choiceIndex = String(index);
  const marker = document.createElement("span");
  marker.className = "map-dialog-option-marker";
  marker.textContent = index === selectedIndex ? "▶︎" : "";
  const label = document.createElement("span");
  label.className = "map-dialog-option-label";
  label.textContent = option.label;
  button.append(marker, label);
  return button;
}
