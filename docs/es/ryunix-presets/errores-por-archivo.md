# Ryunix Presets: Interceptación de errores basada en archivos

Ryunix simplifica drásticamente los fallos globales de aplicación unificando
caídas de compilación del compilador y panics del Virtual DOM al estilo React en
el mismo overlay de desarrollador exclusivamente mediante lógica de convención
declarativa.

---

## Índice

- [Ryunix Presets: Interceptación de errores basada en archivos](#ryunix-presets-interceptación-de-errores-basada-en-archivos)
  - [Índice](#índice)
  - [1. Captura de errores del App Router (`error.ryx`)](#1-captura-de-errores-del-app-router-errorryx)
  - [2. Inyección global de desarrollo (`webpack.config.mjs`)](#2-inyección-global-de-desarrollo-webpackconfigmjs)

---

## 1. Captura de errores del App Router (`error.ryx`)

Durante el recorrido automatizado de directorios dentro del ciclo de
transpilación `.ryunix/server/app/app-router.js`, Ryunix busca intrínsecamente
nodos `error.ryx` aislados de forma universal.

`AppRouterPlugin.mjs` identifica bindings de exportación específicos (p. ej.
`export default function Error()`) inyectándolos globalmente a través del
segmento topológico `isServerComponent` más cercano.

1. **Envoltorios AST**:

   `<Ryunix.ErrorBoundary fallback={e.default}>{result}</Ryunix.ErrorBoundary>`

2. **Segmentos propagados**: Esto garantiza de forma nativa que lanzar una

   excepción específicamente dentro de `src/app/dashboard/profile.ryx` solo
   colapse el segmento `<Profile />` degradando dinámicamente a
   `src/app/dashboard/error.ryx` sin eliminar catastróficamente los límites
   hermanos `<Sidebar />`.

3. **Fallbacks globales**: Si no existen límites localizados, escala

   recursivamente explícitamente por el árbol hasta ser interceptado fuertemente
   por el `RyunixDevOverlay` principal durante desarrollo, renderizando
   limpiamente trazas de pila al estilo React.

---

## 2. Inyección global de desarrollo (`webpack.config.mjs`)

Ryunix sobrescribe por completo WebSockets genéricos basados en cadenas de
Webpack inyectando sus propios overlays de extracción dual-compiler fuertemente
tipados interactuando físicamente sobre WS.

### Estructura de consolidación dual-compiler

Como `@unsetsoft/ryunixjs` mantiene pipelines de compilación dual explícitos
representando builds Cliente en paralelo nativo a ejecuciones de servidor SSR
Node:

- **Pipelines de deduplicación**: Webpack estándar emite errores de resolución

  de módulo idénticos duplicados de forma redundante (Cliente quejándose de
  `missing file`, Servidor quejándose de `missing file`).

- Ryunix inyecta un `buildOverlayScript` personalizado profundamente dentro de

  `HtmlWebpackPlugin`.

- Usando arquitecturas `Set()` internas, cadenas de trazas de pila parseadas se

  cruzan entre eventos de compilación ocultando implícitamente solapamientos
  duplicados servidor/cliente y emitiendo un único error físico unificado
  exclusivamente.

- **Reinicios de recuperación automática**: Dentro de `errorOverlay.dismiss()`,

  tras reparar limpiamente el archivo Javascript en bruto enganchando un
  `window.location.reload()` activo forzando HMR a borrar definitivamente
  desajustes visuales de diff DOM superpuestos por completo.
