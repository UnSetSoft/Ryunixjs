<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

<p align="center">
  <img src="./assets/logo.png" width="200" height="200" alt="RyunixJS Logo" />
</p>

<h1 align="center">RyunixJS</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@unsetsoft/ryunixjs">
    <img src="https://img.shields.io/npm/v/@unsetsoft/ryunixjs.svg?style=flat-square" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@unsetsoft/ryunixjs/v/canary">
    <img src="https://img.shields.io/npm/v/@unsetsoft/ryunixjs/canary.svg?style=flat-square&label=canary" alt="canary version" />
  </a>
  <img src="https://img.shields.io/npm/l/@unsetsoft/ryunixjs?style=flat-square" alt="license" />
  <a href="https://deepwiki.com/UnSetSoft/Ryunixjs"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

<p align="center">
  <strong>Un framework JavaScript potente, independiente y de alto rendimiento para construir aplicaciones web modernas.</strong>
</p>

<!-- markdownlint-enable MD013 -->

---

## 🚀 ¿Qué es RyunixJS?

RyunixJS es un framework de UI moderno diseñado para ser **completamente
independiente**. Aunque se inspira en bibliotecas populares como React y Preact,
no las incluye internamente. Ofrece una API familiar (Hooks, componentes) pero
sigue su propio camino para una experiencia de desarrollo más manejable y
adaptable.

Tanto si construyes un sitio estático simple como una SPA compleja con
renderizado en servidor (SSR), RyunixJS te da las herramientas para hacerlo con
eficiencia.

## ✨ Características principales

- **🎯 Cero dependencias**: El core es ligero e independiente.
- **⚛️ API familiar**: Usa `useStore`, `useEffect`, `useContext` y más. Similar

  a React, pero con hooks propios de Ryunix.

- **🌐 Render híbrido**: Soporte integrado para **SSR** y **SSG**.
- **🔋 Potencia en servidor**: Server Components y Server Actions para flujos

  full-stack modernos.

- **📝 MDX nativo**: Documentación o páginas ricas en MDX con integración

  fluida.

- **📦 Hooks especializados**: `usePersistentStore`, `useSwitch`, `useDebounce`,

  `useThrottle`, y más.

- **🛠️ Tooling integrado**: Presets potentes y CLI dedicada para empezar en

  segundos.

- **🔍 DevTools**: Extensión de navegador para depurar aplicaciones Ryunix.

## 📦 Paquetes

RyunixJS es un monorepo con varios paquetes especializados:

| Paquete                                                    | Descripción                                          |
| :--------------------------------------------------------- | :--------------------------------------------------- |
| [`@unsetsoft/ryunixjs`](./packages/core)                   | Core: reconciliador, hooks y utilidades DOM.         |
| [`@unsetsoft/ryunix-presets`](./packages/ryunix-presets)   | Tooling unificado y configuraciones Webpack.         |
| [`@unsetsoft/cra`](./packages/cra)                         | CLI oficial para crear proyectos Ryunix.             |
| [`@unsetsoft/ryunix-devtools`](./packages/ryunix-devtools) | Extensión para inspeccionar el árbol de componentes. |

## 🛠️ Primeros pasos

La forma más rápida de crear un proyecto es con la CLI:

```bash
npx @unsetsoft/cra@latest my-ryunix-app
```

Entra en la app e inicia el servidor de desarrollo:

```bash
cd my-ryunix-app
npm run dev
```

## 📚 Documentación

Para mantenedores y contribuidores que exploran el monorepo:

- **[Resumen técnico interno](./docs/es/resumen.md)** — arquitectura de `core`,

  `ryunix-presets` y `cra` (Virtual DOM, hooks, CLI, routing, SSG y más).

- **[Guía del repositorio](./docs/es/guias/guia-del-repositorio.md)** — qué es

  RyunixJS, comparación con Next.js y estructura de la raíz del repo.

## 🤝 Contribuir

¡Agradecemos las contribuciones! Si tienes ideas, reportes de bugs o nuevas
funcionalidades:

1. **Revisa issues**: Comprueba si ya existe un issue o crea uno para proponer

   el cambio.

2. **Ramas**:
   - Crea una rama `gh/[usuario]/[nombre-feature]`.
   - Todos los cambios deben apuntar primero a la rama `canary`.
3. **Commits**: Mensajes simples y descriptivos.
4. **Versiones**: **No** cambies versiones en `package.json` manualmente; se

   gestionan en el release.

Consulta la [guía de contribución](./CONTRIBUTING.es.md) para más detalles.

## 🔒 Seguridad

Si descubres una vulnerabilidad de seguridad, **no** abras un issue público.
Consulta la [política de seguridad](./SECURITY.es.md) para ver las versiones
soportadas y cómo reportarla de forma responsable.

## 👑 Contribuidores

<a href="https://github.com/UnSetSoft/Ryunixjs/graphs/contributors">
  <img
    src="https://contrib.rocks/image?repo=UnSetSoft/Ryunixjs"
    alt="Contribuidores"
  />
</a>

## 📄 Licencia

RyunixJS está bajo [licencia MIT](./LICENSE).

---

<p align="center">
  Hecho con ❤️ por <a href="https://github.com/UnSetSoft">UnSetSoft</a>
</p>
