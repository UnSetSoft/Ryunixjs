# `packages/ryunix-devtools` — `@unsetsoft/ryunix-devtools`

Chrome (and Chromium-based) extension for inspecting Ryunix component trees,
props, and hook usage at runtime. Complements in-core dev warnings and the
profiler documented under `core/`.

---

## Role in the monorepo

| Aspect                        | Detail                                                                  |
| :---------------------------- | :---------------------------------------------------------------------- |
| **Consumer**                  | Developers debugging Ryunix apps in the browser                         |
| **Not an npm app dependency** | Loaded as an unpacked extension or store build                          |
| **Publish**                   | Excluded from root `pnpm publish:all` (extension distribution, not npm) |

---

## Layout

```text
packages/ryunix-devtools/
├── manifest.json
├── panel.html / panel.js    # DevTools panel UI
├── content/                 # Content scripts & bridge to the page
└── README.md
```

---

## Commands

Load unpacked in Chrome: `chrome://extensions/` → **Load unpacked** → select
`packages/ryunix-devtools`.

Optional zip for distribution (from package README):

```bash
npm run build   # creates devtools.zip (when run inside the package)
```

Use the **Ryunix** panel in DevTools (F12) on a running Ryunix app.

---

## Related docs

| Topic                        | Document                                                                     |
| :--------------------------- | :--------------------------------------------------------------------------- |
| Core profiler & dev warnings | [../core/devtools-and-profiler.md](../core/devtools-and-profiler.md)         |
| VS Code extension (editor)   | [../ryunix-vscode/package-overview.md](../ryunix-vscode/package-overview.md) |
