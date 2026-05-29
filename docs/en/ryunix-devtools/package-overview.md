# Ryunix DevTools — package overview

> **Language / Idioma:** [English](./package-overview.md) ·
> [Español](../../es/ryunix-devtools/resumen-paquete.md)

The **`@unsetsoft/ryunix-devtools`** package lives in
`packages/ryunix-devtools/`. It is a **browser extension** (Chrome / Edge) for
debugging Ryunix applications: component tree, props, and hook counters. It is
not consumed as an npm library by apps; you load it _unpacked_ from the
monorepo.

---

## Table of contents

- [Ryunix DevTools — package overview](#ryunix-devtools--package-overview)
  - [Table of contents](#table-of-contents)
  - [Role in the monorepo](#role-in-the-monorepo)
  - [Public usage](#public-usage)
  - [Layout of `packages/ryunix-devtools/`](#layout-of-packagesryunix-devtools)
  - [Extension pieces](#extension-pieces)
  - [TypeScript and build](#typescript-and-build)
  - [High-level flow](#high-level-flow)
  - [Related documentation](#related-documentation)

---

## Role in the monorepo

| Package                      | Responsibility                                                   |
| :--------------------------- | :--------------------------------------------------------------- |
| `@unsetsoft/ryunixjs`        | Dev-time debugging hooks in core (`devtools` module)             |
| `@unsetsoft/ryunix-devtools` | Chrome DevTools UI that reads that state                         |
| `@unsetsoft/ryunix-presets`  | Serves the app where the extension runs                          |
| `@unsetsoft/cra`             | May recommend the VS Code Ryunix extension in workspace settings |

The extension does **not** run during `ryunix build` or ship in production app
bundles. It is a maintainer and developer tool.

---

## Public usage

Local install (from a repo clone):

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. **Load unpacked** → select `packages/ryunix-devtools`
4. Open DevTools (F12) on a Ryunix app and use the **Ryunix** panel

Requires a compatible core version (see package README, e.g. Ryunix 1.3+).

---

## Layout of `packages/ryunix-devtools/`

```text
packages/ryunix-devtools/
├── package.json
├── manifest.json           # Manifest V3; points at compiled *.js
├── tsconfig.json
├── tsconfig.emit.json      # Emits .js next to each .ts at package root
├── chrome.d.ts             # Minimal Chrome API stubs (no @types/chrome)
├── window.d.ts
├── background.ts / background.js       # Service worker
├── content-script.ts / content-script.js
├── devtools.ts / devtools.js           # Bridge to Chrome DevTools API
├── devtools.html                       # devtools_page in manifest
├── hook.ts / hook.js                   # Injected into the page (web_accessible)
├── panel.ts / panel.js
└── panel.html                          # Ryunix panel UI
```

There is no `src/` folder: sources and emit live at the **package root**. `.js`
files come from `tsc` except static HTML.

---

## Extension pieces

| File                            | Role                                                          |
| :------------------------------ | :------------------------------------------------------------ |
| `manifest.json`                 | Permissions, `content_scripts`, `background`, `devtools_page` |
| `content-script.js`             | Runs at document start on configured URLs                     |
| `hook.js`                       | Page-accessible resource; bridges to Ryunix runtime           |
| `background.js`                 | Service worker (MV3)                                          |
| `devtools.js` + `devtools.html` | Creates the custom DevTools panel                             |
| `panel.js` + `panel.html`       | Component tree, props, hook counter                           |

Automatic detection depends on dev core exposing data the hook reads (see
[devtools-and-profiler.md](../core/devtools-and-profiler.md)).

---

## TypeScript and build

| Script      | Command                         |
| :---------- | :------------------------------ |
| `typecheck` | `tsc --noEmit -p tsconfig.json` |
| `build`     | `tsc -p tsconfig.emit.json`     |

Emit includes: `background.ts`, `content-script.ts`, `devtools.ts`, `hook.ts`,
`panel.ts`.

After editing `.ts`:

```bash
pnpm --filter @unsetsoft/ryunix-devtools typecheck
pnpm --filter @unsetsoft/ryunix-devtools build
```

Reload the extension on `chrome://extensions/` before testing.

---

## High-level flow

```mermaid
flowchart TB
  subgraph page ["Tab: Ryunix app"]
    APP[@unsetsoft/ryunixjs bundle]
    HOOK[hook.js injected]
    APP <--> HOOK
  end
  subgraph ext ["ryunix-devtools extension"]
    CS[content-script.js]
    BG[background.js]
    DT[devtools.js]
    PN[panel.html + panel.js]
    CS --> HOOK
    DT --> PN
  end
  subgraph chrome ["Chrome"]
    F12[DevTools]
    F12 --> DT
  end
```

1. `content-script` runs when the page loads.
2. `hook.js` talks to the Ryunix runtime in the page.
3. The DevTools panel renders tree and metadata from that bridge.

---

## Related documentation

| Document                                                          | Content                               |
| :---------------------------------------------------------------- | :------------------------------------ |
| [core/devtools-and-profiler.md](../core/devtools-and-profiler.md) | Engine dev warnings and profiler      |
| [core/package-overview.md](../core/package-overview.md)           | `@unsetsoft/ryunixjs` package         |
| [Local integration app](../guides/local-integration-app.md)       | Test an app with the extension loaded |
| `packages/ryunix-devtools/README.md`                              | Install steps and compatibility       |
