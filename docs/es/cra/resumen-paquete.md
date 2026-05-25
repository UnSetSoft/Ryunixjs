# `packages/cra` — `@unsetsoft/cra`

Scaffolder oficial de proyectos (`npx @unsetsoft/cra`). CLI interactiva que
copia plantillas, resuelve versiones npm (latest / canary) y opcionalmente
configura Tailwind, ESLint y recomendaciones de VS Code.

---

## Rol en el monorepo

| Aspecto | Detalle |
| :------ | :------ |
| **Consumidor** | Desarrolladores que crean apps Ryunix (no es dependencia de runtime) |
| **Plantillas** | `templates/` (`ryunix-base`, variantes con Tailwind, etc.) |
| **VS Code** | `--vscode` escribe `.vscode/extensions.json` para `unsetsoft.ryunixjs` |

---

## Estructura

```text
packages/cra/
├── src/
│   ├── cli.js           # Entrada Commander (`npx @unsetsoft/cra`)
│   └── create-app.js    # Prompts, copia, resolución de dependencias
├── templates/           # Proyectos iniciales (app/, ryunix.config.js, …)
└── package.json
```

---

## Comandos

```bash
# Ejecutar la CLI localmente desde el monorepo
pnpm --filter @unsetsoft/cra run dev

# Usuarios finales
npx @unsetsoft/cra@latest my-app
npx @unsetsoft/cra@latest my-app --canary --tailwind --eslint --vscode
```

Publicación (mantenedores): `pnpm run cra:release` o `pnpm run cra:nightly` en
la raíz del monorepo.

---

## Documentación relacionada

| Tema | Documento |
| :--- | :-------- |
| CLI y ayudantes | [cli-y-ayudantes.md](./cli-y-ayudantes.md) |
| Generación de plantillas | [generacion-de-plantillas.md](./generacion-de-plantillas.md) |
| Extensión VS Code | [../ryunix-vscode/resumen-paquete.md](../ryunix-vscode/resumen-paquete.md) |
