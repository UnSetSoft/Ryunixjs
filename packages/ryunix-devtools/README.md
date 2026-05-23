<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

# Ryunix DevTools Extension

Chrome extension for debugging Ryunix applications.

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `packages/ryunix-devtools` folder

## Usage

1. Open DevTools (F12)
2. Open the **Ryunix** panel
3. The extension automatically detects Ryunix applications

## Features

- Real-time component tree
- Props inspection
- Hook counter
- Automatic detection

## Development

```bash
npm run build  # Creates devtools.zip
```

## Compatibility

- Chrome 88+
- Edge 88+
- Ryunix 1.3.0+
