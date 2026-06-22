const pixelButtonParts = [
  "top-left",
  "top",
  "top-right",
  "left",
  "center",
  "right",
  "bottom-left",
  "bottom",
  "bottom-right"
];

export function setPixelButtonLabel(button, label, { variant = "default" } = {}) {
  button.classList.add("pixel-ui-button");
  button.classList.toggle("pixel-ui-button--combat", variant === "combat");
  button.setAttribute("aria-label", label);

  let labelNode = button.querySelector(".pixel-button-label");
  if (!labelNode) {
    const frame = document.createElement("span");
    frame.className = "pixel-button-frame";
    frame.setAttribute("aria-hidden", "true");

    pixelButtonParts.forEach((part) => {
      const piece = document.createElement("span");
      piece.className = `pixel-button-piece ${part}`;
      frame.append(piece);
    });

    labelNode = document.createElement("span");
    labelNode.className = "pixel-button-label";
    button.replaceChildren(frame, labelNode);
  }

  labelNode.textContent = label;
  return labelNode;
}
