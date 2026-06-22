export function bindPress(element, handler) {
  let handledPointerTime = 0;

  const handlePointerUp = (event) => {
    if (event.pointerType === "mouse" || element.disabled) return;
    event.preventDefault();
    handledPointerTime = Date.now();
    handler(event);
  };

  const handleClick = (event) => {
    if (Date.now() - handledPointerTime < 420) return;
    if (element.disabled) return;
    handler(event);
  };

  element.addEventListener("pointerup", handlePointerUp);
  element.addEventListener("click", handleClick);

  return () => {
    element.removeEventListener("pointerup", handlePointerUp);
    element.removeEventListener("click", handleClick);
  };
}
