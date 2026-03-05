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
| `⌘ Z` | Undo |
| `Delete/Backspace` | Delete selected object |
| `Escape` | Deactivate/Deselect |

## Drawing tools (press key when overlay active)

`P` Pen · `H` Highlighter · `A` Arrow · `R` Rectangle · `E` Ellipse · `L` Line · `T` Text · `X` Eraser · `S` Spotlight · `N` Counter · `V` Select

## Object manipulation

With the **Select tool (V)**:

- Click objects to select them
- Drag selected objects to move
- Drag corner/edge handles to resize
- Click red × button to delete
- Press `Delete` or `Backspace` to delete selected

## Toolbar features

- **FAB button** (top-right) - Expand/collapse toolbar
- **Smooth toggle** - Enable pen smoothing
- **Dim toggle** - Darken outside shapes
- **Color swatches** - Quick color selection
- **Size presets** - Thin/Medium/Thick strokes
- **Opacity slider** - Adjust transparency

> macOS may prompt for **Screen Recording permission** on first launch — approve it in System Settings → Privacy & Security.