# Manejo de errores y DevOverlay global de RyunixJS

Ryunix aísla fuertemente los componentes a nivel estructural para evitar que todo el DOM frontend colapse ante una sola excepción de componente.

Presenta dos capas distintas:
1. Error Boundaries declarativos para fallbacks de producción.
2. Overlays de diagnóstico global agresivos desplegados automáticamente durante builds de desarrollo `.env`.

---

## 1. Intercepción de errores (`workers.js`)

Durante `performUnitOfWork(fiber)`, las funciones de renderizado de componentes se envuelven en un bloque `try/catch` explícito.

Si se dispara una excepción no manejada:
1. Ryunix inspecciona `fiber.props` del componente que falla para extraer metadatos estructurales (p. ej. `fiber.props.__source` inyectado de forma nativa por pasos de compilación SWC/Babel) mapeando números de línea exactos (`index.ryx:80`).
2. Recorre hacia arriba el árbol `fiber` padre dinámicamente, buscando exclusivamente un componente tipado estrictamente como `RYUNIX_ERROR_BOUNDARY`.
3. Si se localiza, Ryunix muta `stateError` interno del Error Boundary para albergar el objeto `Error` de JavaScript exacto.
4. **Amputación del árbol**: Establece `fiber.child = null` directamente, atravesando la lógica de la rama corrupta internamente, forzando al Work Loop a omitir limpiamente el bloque de render inválido y revertir de forma limpia a evaluar la prop de árbol `fallback` del boundary.

---

## 2. Fallbacks declarativos (`errorBoundary.js`)

### `<ErrorBoundary />`
Un componente envoltorio nativo que proporciona desacoplamiento con alcance.

```jsx
<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <BuggyComponent />
</ErrorBoundary>
```

Si `BuggyComponent` explota, el `ErrorBoundary` tragará silenciosamente la excepción y renderizará el `<div />` declarativo. En entornos de producción, esto garantiza que las aplicaciones degraden secciones con elegancia sin exponer trazas feas o pantallas en blanco.

---

## 3. Overlay global de desarrollador (`devOverlay.js`)

En entornos no productivos, los desarrolladores necesitan feedback inmediato y agresivo que detalle qué falló, dónde y por qué, sin abrir la consola DevTools del navegador.

Ryunix implementa `RyunixDevOverlay`, un modal gráfico no suscribible instanciado universalmente alrededor del árbol raíz de la aplicación (inyectado automáticamente por el ecosistema interno Webpack `AppRouterPlugin` si falta `error.ryx`).

### Arquitectura funcional
- Cuando `errorBoundary.js` atrapa un fallo en un build no productivo, en lugar de mostrar solo tu cadena fallback sin CSS personalizado, genera `<RyunixDevOverlay />`.
- **Trazado de pila inteligente**: `RyunixDevOverlay` ejecuta matchers Regex contra layouts de pila de error específicos del navegador (V8 Chrome, SpiderMonkey Firefox). Filtra explícitamente rutinas de ruido interno del framework (`packages/core/src/lib/workers.js`) para que el desarrollador solo inspeccione trazas que coincidan con sus propias rutas de código de aplicación.
- **Localización física del código fuente**: Aprovechando el `error.__ryunix_source` preciso mapeado hacia atrás por `workers.js` durante el ciclo de fallo, `RyunixDevOverlay` emite un `fetch()` dinámico dirigido directamente a la API de desarrollo Webpack (`/_ryunix/source?file=index.ryx&line=80`) recuperando fragmentos exactos del archivo fuente físico resaltados vívidamente en pantalla.
- **Renderizado resiliente**: La GUI implementa objetos `<div style={{...}}>` genéricos estrictos en línea para evitar rígidamente que la interfaz del overlay se rompa si las hojas de estilo de la aplicación estándar (p. ej. PostCSS, Tailwind) están fallando o no funcionan correctamente.
