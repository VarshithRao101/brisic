# Brisic: frontend prototype (complete)

Every screen of the prototype, 33 files, nothing left out. No backend, no payments.

## How to open it
1. Run the unpack script once (it created this folder).
2. In this folder run:  `python3 -m http.server 8000`  (or `npx serve`)
3. Open http://localhost:8000/Splash.dc.html  (start here). `Overview.dc.html` is a map of all screens.
(Do not double-click the files: browsers block parts of the page when opened as file://.)

## What the files are
- `*.dc.html`: one file per screen. Each has the screen's layout and styling (HTML + inline CSS) and its logic in a small `class Component` at the bottom (state, fake data, what each button does).
- `support.js`: the small runtime (React based) that makes the `{{ }}`, `<sc-for>` and `<sc-if>` tags work. Needed by every screen.
- `canvas.json`: screen titles and layout of the design canvas (not needed to run).
- `assets/`: the B logo (glowing and plain), coin and crown images.

All data is fake. The prototype remembers things (coins, theme, photo, last song) in the browser's localStorage. The page needs internet only for the Outfit font from Google Fonts.
