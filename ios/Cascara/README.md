# Cascara iOS Test App

Prototype iOS local qui charge la version GitHub Pages du jeu dans un `WKWebView`.

URL chargee :

```text
https://nostick-games.github.io/cascara-prologue/
```

## Pont natif disponible dans le jeu

Swift injecte `window.CascaraNative` au chargement de la page :

```js
await window.CascaraNative.save("autosave", saveState);
const saveState = await window.CascaraNative.load("autosave");
await window.CascaraNative.delete("autosave");
await window.CascaraNative.haptic("success");
await window.CascaraNative.log("message de debug");
```

Les sauvegardes sont stockees dans `Application Support/CascaraSaves`.

