# ScreenInk 🖊️

A transparent screen annotation overlay for macOS.

---

## Required folder structure

```
annotate/               ← your folder name
├── package.json
└── src/
    ├── main.js
    ├── preload.js
    └── overlay.html
```

Make sure `src/` exists and all three JS/HTML files are inside it.

---

## Run it

```bash
cd annotate
npm install
npm start
```

Press **Cmd+Shift+A** to toggle the overlay on/off.

---

## Build .dmg

```bash
npm run build
```

Output appears in `dist/`.

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ Shift A` | Toggle overlay |
| `⌘ Shift C` | Clear canvas |
| `⌘ Shift Z` | Undo |
| `Escape` | Deactivate |

## Drawing tools (press key when overlay active)

`P` Pen · `H` Highlighter · `A` Arrow · `R` Rectangle · `E` Ellipse · `L` Line · `T` Text · `X` Eraser · `S` Spotlight · `N` Counter

> macOS may prompt for **Screen Recording permission** on first launch — approve it in System Settings → Privacy & Security.