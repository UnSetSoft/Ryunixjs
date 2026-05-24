# Contribuir a RyunixJS

> **Language / Idioma:** [English](./CONTRIBUTING.md) ·
> [Español](./CONTRIBUTING.es.md)

Gracias por tu interés en contribuir a RyunixJS. Nos alegra ver crecer la
comunidad y valoramos cualquier ayuda para hacer de RyunixJS el mejor framework
independiente posible.

## 🌈 Filosofía

RyunixJS ofrece una alternativa manejable e independiente para construir
aplicaciones web sin depender de React u otro estándar externo. Valoramos el
rendimiento, la modularidad y una buena experiencia de desarrollo.

## 🐛 Reportar bugs

Si encuentras un bug,
[abre un issue](https://github.com/UnSetSoft/Ryunixjs/issues) en GitHub. Incluye
el máximo detalle posible:

- Un título claro y descriptivo.
- Pasos para reproducir el problema.
- Comportamiento esperado vs. real.
- Entorno (versión de Node, SO, navegador).

## ✨ Proponer mejoras

¿Tienes una idea para una nueva función?

1. Abre un issue para discutir la propuesta primero.
2. Una vez validada, podrás enviar un Pull Request.

## 🛠️ Configuración de desarrollo

Este proyecto es un monorepo gestionado con **pnpm** y **Turbo**.

### Requisitos

- **Node.js**: >= 22.x
- **pnpm**: Última versión (v10+ muy recomendada)

### Empezar

1. **Clona el repositorio**:

   ```bash
   git clone https://github.com/UnSetSoft/Ryunixjs.git
   cd Ryunixjs
   ```

1. **Instala dependencias**:

   ```bash
   pnpm install
   ```

1. **Modo desarrollo**:

   ```bash
   pnpm run dev
   ```

### Scripts principales

| Comando                   | Descripción                                                    |
| :------------------------ | :------------------------------------------------------------- |
| `pnpm run dev`            | Ejecuta todos los paquetes en desarrollo con Turbo.            |
| `pnpm run build`          | Compila todos los paquetes del monorepo.                       |
| `pnpm run test`           | Ejecuta la suite de tests.                                     |
| `pnpm run lint`           | Comprueba estilo y lint.                                       |
| `pnpm run lint:md`        | Lint de Markdown (docs, raíz, READMEs).                        |
| `pnpm run lint:md:fix`    | Corrige Markdown (`markdownlint-cli2 --fix` + Prettier).       |
| `pnpm run lint:fix`       | Corrige lint y formato automáticamente.                        |
| `pnpm run format`         | Formatea con Prettier.                                         |
| `pnpm run clean`          | Limpia artefactos de build y `node_modules`.                   |
| `pnpm run run:web`        | Ejecuta el proyecto de prueba Webpack en desarrollo.           |
| `pnpm run release:canary` | Prepara y publica la versión Canary del core.                  |
| `pnpm run publish:canary` | Publica paquetes (excepto tests y devtools) con tag `@canary`. |

## 🌿 Estrategia de ramas

Usa esta convención de nombres:

- **Formato**: `gh/[tu-usuario]/[nombre-descriptivo]` (ej.

  `gh/neyunse/fix-hook-bug`)

- **Destino**: Todos los cambios deben apuntar a la rama **`canary`**.

## 📝 Commits y PRs

- **Mensajes de commit**: Simples, descriptivos y en inglés.
- **Versiones**: **No** cambies versiones en `package.json` manualmente.
- **Enlazar issues**: En la descripción del PR usa `Closes #123` para cerrar

  issues relacionados.

- **Verificación**: Asegúrate de que pasen tests y lint (`pnpm run test` y

  `pnpm run lint`) antes de enviar. Guía detallada por paquete:
  [docs/es/guias/tests-automatizados.md](docs/es/guias/tests-automatizados.md).

## 🚀 Flujo de release

1. **Canary**: Funcionalidades y correcciones llegan aquí para evaluación

   inicial.

2. **Stable**: Releases finales tras verificación exhaustiva en canary.

### GitHub Actions (CI y publicación npm)

- **CI** (`.github/workflows/ci.yml`): solo compila `@unsetsoft/ryunixjs` (Rollup).
  `@unsetsoft/ryunix-presets` no tiene build (publica `webpack/` tal cual).
  También Jest, ESLint, Markdown, Prettier y smoke build CRA.
- **Release** (`.github/workflows/release.yml`): **Trusted Publishing (OIDC)** con
  provenance. Sin secreto `NPM_TOKEN`.

#### Trusted Publisher en npm (una vez por paquete)

En [npmjs.com](https://www.npmjs.com/) → paquete → **Settings** → **Trusted
publishing**, para `@unsetsoft/ryunixjs`, `@unsetsoft/ryunix-presets` y
`@unsetsoft/cra`:

| Campo | Valor |
| :---- | :---- |
| Provider | GitHub Actions |
| Repository | `UnSetSoft/Ryunixjs` |
| Workflow filename | `release.yml` |

Tras validar: **Publishing access** → exigir 2FA y deshabilitar tokens; revoca
tokens de automatización antiguos.

**Actions → Release → Run workflow** con **dry-run** hasta que las versiones en
`package.json` estén listas. Tag `v*` publica en serio (`canary` en el nombre →
tag npm `canary`; si no → `latest`).

## 📄 Licencia

Al contribuir a RyunixJS, aceptas que tus contribuciones se licencien bajo la
[licencia MIT](LICENSE).

---

¡Feliz coding! 🚀
