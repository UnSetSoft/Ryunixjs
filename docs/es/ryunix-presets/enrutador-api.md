# Ryunix Presets: Infraestructura de API routing

La capa API de Ryunix no la impulsa el compilador Webpack core. En su lugar,
utiliza un sistema de compilación aislado fuera de banda que maximiza el
rendimiento específicamente para contextos backend.

---

## Índice

- [Ryunix Presets: Infraestructura de API routing](#ryunix-presets-infraestructura-de-api-routing)
  - [Índice](#índice)
  - [1. Compilación fuera de banda (`ApiRouterPlugin.mjs`)](#1-compilación-fuera-de-banda-apirouterpluginmjs)
  - [2. Pipeline de manejo de peticiones (`apiHandler.mjs`)](#2-pipeline-de-manejo-de-peticiones-apihandlermjs)

---

## 1. Compilación fuera de banda (`ApiRouterPlugin.mjs`)

Como las rutas API no requieren loaders CSS complejos ni parseo de cadenas CSS,
enviarlas por los loaders masivos de Webpack es un desperdicio.

1. **Transformaciones SWC directas**: Ryunix importa `@swc/core` de forma

   nativa. Observa por completo `src/app/api/**/*.js`, `.ts` y `.ryx`.

2. **Destino ESM**: Los archivos pasan directamente por el motor

   `transformSync(content)` SWC basado en Rust generando explícitamente
   configuraciones de módulos ES6 ES2022 nativos de Node.js.

3. **Salida de archivos**: Las estructuras AST se escriben agresivamente

   directamente en `.ryunix/server/api/` completamente independientes de los
   bundles pesados `app-router-server.js` que resuelven pipelines Webpack por
   completo.

---

## 2. Pipeline de manejo de peticiones (`apiHandler.mjs`)

En cada petición HTTP que golpea `/api/`, el servidor web de producción
(`prod.server.mjs`) delega coincidencias de cadenas de routing internamente
dentro del entorno node.

### Resolución dinámica (`matchRoute`)

Refleja dinámicamente estructuras de rutas topológicas al estilo Next.js
estrictamente sin dependencias masivas:

- Intercepta peticiones como `GET /api/users/123`.
- Recorre directorios de forma nativa ejecutando bucles de mapeo de estructura

  de carpetas anidadas identificando estructuras como `[id]` extrayendo la
  variable agresivamente en `req.params`.

- Detecta configuraciones catch-all `[...slug]` extrayendo params anidados en

  bucle profundo mapeándolos de forma idéntica y explícita de forma estática.

### Ejecución y hot reloading

Una vez la ruta del endpoint queda estrictamente fijada, Ryunix aprovecha
enlaces REST estándar:

1. **Carga ESM**: Ryunix importa dinámicamente el módulo compilado objetivo

   utilizando `await import(importUrl)` nativo de Node.js.

2. **Hot-Reloading hack**: Para superar las limitaciones estrictas de

   invalidación de caché ESM de Node específicamente en modo desarrollo, Ryunix
   añade dinámicamente `?update=${Date.now()}` físicamente a la cadena del
   cargador de módulos. Esto fuerza a Node a volver a descargar el archivo API
   físicamente sin detener el runtime del servidor.

3. **Ejecución**: Empareja `req.method.toUpperCase()` localmente contra los

   bindings de diccionario exportados dentro del endpoint API
   (`export const GET = () => {}`). Handshake completo.
