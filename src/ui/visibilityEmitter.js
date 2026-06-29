// Émetteur minimal d'événements de cycle de vie pour les modales.
// Remplace l'observation du DOM (MutationObserver sur `hidden`) par de vrais
// événements open/close auxquels on peut s'abonner. `isOpen` reflète l'état courant.
export function createVisibilityEmitter() {
  const listeners = { open: new Set(), close: new Set() };
  let open = false;

  return {
    get isOpen() {
      return open;
    },
    onOpen(listener) {
      listeners.open.add(listener);
      return () => listeners.open.delete(listener);
    },
    onClose(listener) {
      listeners.close.add(listener);
      return () => listeners.close.delete(listener);
    },
    emitOpen() {
      open = true;
      listeners.open.forEach((listener) => listener());
    },
    emitClose() {
      open = false;
      listeners.close.forEach((listener) => listener());
    }
  };
}
