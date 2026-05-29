<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

# Extensión Ryunix DevTools

Extensión WebExtension (Manifest V3) para depurar aplicaciones Ryunix en
Chromium y Firefox.

## Instalación

### Chrome / Edge / Brave

1. Compila la extensión: `pnpm run build` (desde esta carpeta o con
   `pnpm --filter @unsetsoft/ryunix-devtools run build` en la raíz).
2. Abre `chrome://extensions/` (Edge: `edge://extensions/`).
3. Activa **Modo de desarrollador**.
4. **Cargar extensión sin empaquetar** → selecciona `packages/ryunix-devtools`.

### Firefox

1. Compila con el mismo comando `pnpm run build`.
2. Abre `about:debugging#/runtime/this-firefox`.
3. **Cargar extensión temporal** → selecciona el archivo `manifest.json` de
   esta carpeta.

## Uso

1. Abre DevTools (F12).
2. Busca la pestaña **Ryunix**.
3. La extensión detectará automáticamente aplicaciones Ryunix.

## Características

- Árbol de componentes en tiempo real
- Inspección de props
- Contador de hooks
- Detección automática

## Desarrollo

```bash
pnpm run build   # Sincroniza manifest.version y compila dist/
pnpm run typecheck
```

El campo `version` del manifest debe ser solo números (`1.3.1` o `1.2.3.1`);
Chrome rechaza sufijos npm como `-canary.1`. El script `build:manifest` lo
genera desde `package.json`.

## Compatibilidad

- Chrome 88+
- Edge 88+
- Firefox 109+ (Manifest V3)
- Ryunix 1.3.0+
