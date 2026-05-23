> **Idioma / Language:** [Español](./CONTRIBUTING.es.md) · [English](./CONTRIBUTING.md)

# Contribuir a RyunixJS

Gracias por tu interés en contribuir a RyunixJS. Nos alegra ver crecer la comunidad y valoramos cualquier ayuda para hacer de RyunixJS el mejor framework independiente posible.

## 🌈 Filosofía

RyunixJS ofrece una alternativa manejable e independiente para construir aplicaciones web sin depender de React u otro estándar externo. Valoramos el rendimiento, la modularidad y una buena experiencia de desarrollo.

## 🐛 Reportar bugs

Si encuentras un bug, [abre un issue](https://github.com/UnSetSoft/Ryunixjs/issues) en GitHub. Incluye el máximo detalle posible:

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

2. **Instala dependencias**:

   ```bash
   pnpm install
   ```

3. **Modo desarrollo**:

   ```bash
   pnpm run dev
   ```

### Scripts principales

| Comando | Descripción |
| :--- | :--- |
| `pnpm run dev` | Ejecuta todos los paquetes en desarrollo con Turbo. |
| `pnpm run build` | Compila todos los paquetes del monorepo. |
| `pnpm run test` | Ejecuta la suite de tests. |
| `pnpm run lint` | Comprueba estilo y lint. |
| `pnpm run lint:fix` | Corrige lint y formato automáticamente. |
| `pnpm run format` | Formatea con Prettier. |
| `pnpm run clean` | Limpia artefactos de build y `node_modules`. |
| `pnpm run run:web` | Ejecuta el proyecto de prueba Webpack en desarrollo. |
| `pnpm run release:canary` | Prepara y publica la versión Canary del core. |
| `pnpm run publish:canary` | Publica paquetes (excepto tests y devtools) con tag `@canary`. |

## 🌿 Estrategia de ramas

Usa esta convención de nombres:

- **Formato**: `gh/[tu-usuario]/[nombre-descriptivo]` (ej. `gh/neyunse/fix-hook-bug`)
- **Destino**: Todos los cambios deben apuntar a la rama **`canary`**.

## 📝 Commits y PRs

- **Mensajes de commit**: Simples, descriptivos y en inglés.
- **Versiones**: **No** cambies versiones en `package.json` manualmente.
- **Enlazar issues**: En la descripción del PR usa `Closes #123` para cerrar issues relacionados.
- **Verificación**: Asegúrate de que pasen tests y lint (`pnpm run test` y `pnpm run lint`) antes de enviar.

## 🚀 Flujo de release

1. **Canary**: Funcionalidades y correcciones llegan aquí para evaluación inicial.
2. **Stable**: Releases finales tras verificación exhaustiva en canary.

## 📄 Licencia

Al contribuir a RyunixJS, aceptas que tus contribuciones se licencien bajo la [licencia MIT](LICENSE).

---

¡Feliz coding! 🚀
