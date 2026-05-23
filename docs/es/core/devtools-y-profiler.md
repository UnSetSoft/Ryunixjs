# DevTools y Profiler de rendimiento de RyunixJS

Ryunix incorpora un subsistema de diagnóstico interno habilitado estrictamente
cuando `process.env.NODE_ENV !== 'production'`. Estos archivos ofrecen a los
desarrolladores advertencias inmediatas en runtime CLI y seguimiento de
rendimiento de precisión sin descargar extensiones de navegador externas.

---

## Índice

- [DevTools y Profiler de rendimiento de RyunixJS](#devtools-y-profiler-de-rendimiento-de-ryunixjs)
  - [Índice](#índice)
  - [1. Herramientas de desarrollo (`devtools.js`)](#1-herramientas-de-desarrollo-devtoolsjs)
  - [2. Profiler de rendimiento en memoria (`profiler.js`)](#2-profiler-de-rendimiento-en-memoria-profilerjs)

---

## 1. Herramientas de desarrollo (`devtools.js`)

Proporciona capas unificadas de intercepción genérica de `console`.

- **`warning(condition, message)` / `error(message)` / `deprecated()`**:

  Envoltorios estrictamente condicionados alrededor de la API nativa `console`.
  Se eliminan agresivamente del bundle de producción mediante tree-shaking,
  devolviendo `undefined` de forma limpia.

- **`validateHookContext(hookName)`**: Inyectado en cada llamada de

  inicialización de hook (`useStore`, `useEffect`, etc.). Consulta
  `getState().wipFiber`. Si no hay un fiber renderizando activamente, lanza un
  error explícito protegiendo a los desarrolladores de invocar hooks dentro de
  closures JS asíncronas estándar de forma global.

- **`getComponentName()`**: Evalúa etiquetas de función `<Component />` con

  seguridad, devolviendo texto fallback `anonymous` para evitar fallos al
  graficar el Virtual DOM internamente.

---

## 2. Profiler de rendimiento en memoria (`profiler.js`)

A diferencia de los profilers estándar de Webpack, Ryunix mide los tiempos de
renderizado de componentes fundamentalmente desde dentro de los límites exactos
del hilo V-DOM de `requestIdleCallback`.

### Runtime central de `Profiler`

Una instancia de clase global que cachea las duraciones de ejecución en un
`measures: Map` utilizando la API nativa `performance.now()` para capturar
resoluciones exactas a nivel de microsegundos.

- Los re-renders se almacenan internamente en un array buffer circular de

  longitud fija `maxSamples = 100` para evitar hinchazón de memoria en sesiones
  de depuración prolongadas.

- **`logStats()`**: Emite un informe compilado estrictamente a la consola del

  navegador resumiendo `count`, `avg`, tiempos `min`/`max`, y calcula
  dinámicamente `getSlowestComponents(limit = 10)` para acotar físicamente los
  componentes con cuello de botella con facilidad.

### Envoltorios de componentes

Ryunix expone integraciones orientadas al desarrollador para conectar
componentes específicos al pipeline del Profiler de forma dinámica.

- **`withProfiler(Component, name)`**: Un componente de orden superior que

  devuelve una función que llama inherentemente a `profiler.startMeasure(name)`
  justo antes de la evaluación y `profiler.endMeasure()` inmediatamente después.

- **`useProfiler(componentName)`**: Un Hook declarativo. Al iniciarlo mapea una

  marca de tiempo. Devolver el closure interno ejecuta el cálculo diferencial
  con seguridad, reportando la `duration` de ejecución delta de forma sincrónica
  de vuelta al pipeline `profiler.recordRender`.
