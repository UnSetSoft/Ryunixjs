<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

# Ryunix DevTools Extension

WebExtension (Manifest V3) for debugging Ryunix applications in Chromium and
Firefox.

## Installation

### Chrome / Edge / Brave

1. Build the extension: `pnpm run build` (from this folder or
   `pnpm --filter @unsetsoft/ryunix-devtools run build` at the repo root).
2. Open `chrome://extensions/` (Edge: `edge://extensions/`).
3. Enable **Developer mode**.
4. **Load unpacked** → select `packages/ryunix-devtools`.

### Firefox

1. Build with the same `pnpm run build` command.
2. Open `about:debugging#/runtime/this-firefox`.
3. **Load Temporary Add-on** → select this folder’s `manifest.json`.

### Firefox Add-ons (AMO)

1. From this package directory, run `pnpm run build:release`.
2. Upload `dist-packages/ryunix_devtools-firefox.xpi` to
   [addons.mozilla.org](https://addons.mozilla.org/) (or validate with the AMO
   developer hub before submit).
3. The Firefox artifact uses **flat script paths** (`content-script.js` at the
   package root), `background.scripts` as a fallback for `service_worker`, and
   `browser_specific_settings.gecko.data_collection_permissions.required: ["none"]`.

## Usage

1. Open DevTools (F12).
2. Open the **Ryunix** panel.
3. The extension automatically detects Ryunix applications.

## Features

- Real-time component tree
- Props inspection
- Hook counter
- Automatic detection

## Development

```bash
pnpm run build          # Sync manifest.version and compile dist/
pnpm run build:release  # build + zip Chrome and Firefox packages
pnpm run typecheck
```

The manifest `version` field must be numeric only (`1.3.1` or `1.2.3.1`);
Chrome rejects npm-style suffixes like `-canary.1`. The `build:manifest` script
derives it from `package.json`.

## Compatibility

- Chrome 88+
- Edge 88+
- Firefox 109+ (Manifest V3)
- Ryunix 1.3.0+
