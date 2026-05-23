# Ryunix Presets: Arquitectura de routing y SSG

Ryunix abstrae fuertemente la implementación de routing mediante plugins del
compilador Webpack. Los desarrolladores no escriben estructuras manuales
`<Route path="/">`; el sistema de archivos se transcribe universalmente en
cadenas AST de Virtual DOM durante el bucle de compilación de forma automática.

---

## Índice

- [Ryunix Presets: Arquitectura de routing y SSG](#ryunix-presets-arquitectura-de-routing-y-ssg)
  - [Índice](#índice)
  - [1. El framework App Router (`appRouterPlugin.mjs`)](#1-el-framework-app-router-approuterpluginmjs)
  - [2. Manifiestos SSG legacy (`ssgPlugin.mjs`)](#2-manifiestos-ssg-legacy-ssgpluginmjs)
  - [3. Ecosistema de desarrollo SSR (`ssrDevHandler.mjs`)](#3-ecosistema-de-desarrollo-ssr-ssrdevhandlermjs)

---

## 1. El framework App Router (`appRouterPlugin.mjs`)

Este plugin intercepta el hook `beforeCompile` de Webpack escaneando
dinámicamente el directorio `src/app` de forma secuencial.

### Rol y capacidades

- **Heurísticas Regex**: Al localizar archivos de componente `.ryx` o `.js`,

  ejecuta patrones de cadena activamente sobre los blobs fuente (p. ej.
  `export async default function`, `useStore()`). Esto determina automáticamente
  `isServer: true/false` de forma universal sin que el usuario declare límites
  literales `.client.ryx` físicamente.

- **Mapeo topológico**: Ensambla un objeto JavaScript lógico que contiene rutas

  de componentes anidadas `layout`, `index`, `error` y `loading` mapeando
  exactamente a nombres de carpeta con parámetros como `[slug]`.

- **Plantillas de cadenas**: El motor serializa de forma nativa el árbol de

  objetos de vuelta en cadenas JavaScript en bruto. Cablea automáticamente los
  envoltorios `<Ryunix.Suspense>`, `<ServerBoundary>` y `<Ryunix.ErrorBoundary>`
  emitiendo la lógica final del bundle de forma idéntica a
  `.ryunix/server/app/app-router.js` ejecutando transpilación nativa
  implícitamente.

- **Inyecciones de dependencia**: Se integra fuertemente con

  `compilation.contextDependencies` de Webpack. Si se añade/elimina una ruta
  durante la ejecución, Webpack invalida intrínsecamente la caché `devServer`
  forzando a `AppRouterPlugin` a reescanear silenciosamente manteniendo la
  fiabilidad HMR.

---

## 2. Manifiestos SSG legacy (`ssgPlugin.mjs`)

Históricamente reconocido como `RyunixRoutesPlugin`, este plugin orquesta rutas
legacy ligadas estrictamente por la definición de array `routes.ryx` dirigida a
builds de generación de sitios estáticos `.mdx`.

### Motor de parseo AST personalizado

El plugin prioriza fuertemente la velocidad sobre la seguridad de dependencias.
En lugar de descargar transformadores AST pesados de Babel (p. ej. `esprima`),
parsea estructuras de array literal JS exclusivamente usando máquinas de estado
Regex internas robustas y algoritmos de seguimiento de llaves (`{` contando
variables).

1. **Interceptación de frontmatter**: Greps el blob completo buscando imports

   Markdown (`import X, { frontmatter as Y } from "path.mdx"`). Lee el archivo
   MDX objetivo de inmediato del disco físico, elimina las líneas YAML y las
   almacena sin fricción dentro de un diccionario Map activo.

2. **Extracción de variables de plantilla**: A medida que el bucle de cadenas

   extrae definiciones de ruta (`path: \'/docs/${variable.label}\'`), evalúa
   intrínsecamente expresiones de plantilla JavaScript estándar resolviendo el
   mapeo de URL objetivo exacto parseando valores de array y flags booleanos de
   forma nativa.

3. **Listado SSG**: Finaliza expulsando un documento JSON puro (`routes.json`)

   dentro de `.ryunix/ssg/` habilitando por completo al crawler SSG de
   `bin/index.mjs` a renderizar recursivamente cada cadena válida `/docs/x` a
   volúmenes `.html` físicos sin ejecutar contextos de navegadores headless
   reales.

### Motor de prerenderizado

- Carga el bundle servidor `<AppRouter />` directamente en el proceso Node

  utilizando la API core `renderToReadableStream()`.

- Genera e inyecta automáticamente etiquetas `<meta>`, `<link rel="canonical">`

  y `<title>` en la plantilla `index.html` en bruto.

- Guarda la salida HTML codificada en carpetas mapeando directamente a su ruta

  URL de forma nativa.

---

## 3. Ecosistema de desarrollo SSR (`ssrDevHandler.mjs`)

Para garantizar que la experiencia de desarrollador (DX) coincida con la
semántica de producción de forma nativa, el `devServer` de Webpack intercepta
peticiones de forma idéntica:

- Intercepta peticiones `GET` explícitas de `text/html`.
- Simula objetos globales (`window.location`, `document`) con seguridad en Node.
- Ejecuta `renderToReadableStream` en el backend de forma nativa, inyectando la

  estructura HTML estática y etiquetas CSS de desarrollo directamente en el
  buffer de respuesta.

- Elimina implícitamente pantallas en blanco en el First Paint.
