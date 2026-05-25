# `packages/ryunix-devtools` — `@unsetsoft/ryunix-devtools`

Extensión para Chrome (y navegadores Chromium) que inspecciona árboles de
componentes Ryunix, props y uso de hooks en tiempo de ejecución. Complementa las
advertencias de desarrollo y el profiler documentados en `core/`.

---

## Rol en el monorepo

| Aspecto                             | Detalle                                                               |
| :---------------------------------- | :-------------------------------------------------------------------- |
| **Consumidor**                      | Desarrolladores que depuran apps Ryunix en el navegador               |
| **No es dependencia npm de la app** | Se carga como extensión unpacked o build de tienda                    |
| **Publicación**                     | Excluido de `pnpm publish:all` en la raíz (distribución de extensión) |

---

## Estructura

```text
packages/ryunix-devtools/
├── manifest.json
├── panel.html / panel.js    # UI del panel DevTools
├── content/                 # Content scripts y puente con la página
└── README.md
```

---

## Comandos

Carga unpacked en Chrome: `chrome://extensions/` → **Cargar descomprimida** →
selecciona `packages/ryunix-devtools`.

Zip opcional para distribución (según README del paquete):

```bash
npm run build   # crea devtools.zip (dentro del paquete)
```

Usa el panel **Ryunix** en DevTools (F12) sobre una app Ryunix en ejecución.

---

## Documentación relacionada

| Tema                         | Documento                                                                  |
| :--------------------------- | :------------------------------------------------------------------------- |
| Profiler y avisos en el core | [../core/devtools-y-profiler.md](../core/devtools-y-profiler.md)           |
| Extensión VS Code (editor)   | [../ryunix-vscode/resumen-paquete.md](../ryunix-vscode/resumen-paquete.md) |
