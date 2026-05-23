# Componentes avanzados de RyunixJS

Más allá de los elementos DOM estándar y los componentes funcionales con estado, Ryunix proporciona estructuras declarativas avanzadas altamente especializadas, diseñadas para optimizar la velocidad de renderizado y orquestar la semántica del layout.

---

## 1. Carga asíncrona y Suspense (`lazy.js`)

Ryunix incorpora un modelo Suspense nativo capaz de detener el árbol de UI para obtener y ejecutar chunks JS externos de forma dinámica.

### `lazy(importFn)`
Un envoltorio que transforma un chunk físico `import()` estándar en un elemento Virtual DOM de Ryunix.
- El render inicial marca el `status` interno como `PENDING`, devolviendo `null` de forma sincrónica.
- El bloque `useEffect` detecta la Promise interna y enlaza un listener de mutación de estado (`forceUpdate`) una vez que la evaluación del script en segundo plano se resuelve por completo o lanza un error.
- **Integración SSR**: Si se ejecuta en un runtime de servidor, `lazy` marca `_isLazy = true` para que el motor SSR sepa exactamente dónde debe pausarse y ramificarse el pipe de streaming.

### `<Suspense fallback={...}>`
Un componente de límite de orquestación.
Mapea de forma transparente su array directo de hijos buscando `child.type._isLazy`. Si un hijo está `PENDING`, Suspense evita que se pinte el vacío sin estilo y sustituye universalmente el layout por el elemento declarativo `fallback` hasta que el `resolve()` asíncrono más profundo finalice.

### `preload(importFn)`
Una API manual de priorización de red. Evalúa `importFn()` de inmediato, disparando una petición HTTP en segundo plano en lugar de esperar a que el Reconciler monte la lógica lazy del componente.

---

## 2. Memoización de renderizado (`memo.js`)

Para evitar drásticamente que segmentos costosos de UI se reevalúen innecesariamente cuando mutan layouts padre genéricos.

### `memo(Component, arePropsEqual)`
Construye un componente Ryunix de orden superior.
- Mantiene instancias `prevProps` y `prevResult` exclusivamente localizadas dentro del ámbito del closure.
- Por defecto, Ryunix inyecta `shallowEqual` mapeando `Object.keys()` para interceptar explícitamente al Reconciler si las identidades de referencia exactas de props string/number/boolean permanecieron intactas.
- Opcionalmente acepta `deepEqual` para cachear agresivamente las salidas de evaluación en estructuras de props grandes y profundamente anidadas.

---

## 3. Escape hatches del DOM y Portals

A veces la jerarquía estructural limita el comportamiento visual (p. ej. contenedores con `overflow: hidden` que truncan modales).

### `createPortal(children, container)` (`portal.js`)
Devuelve un nodo Virtual marcado internamente con un `Symbol` Javascript `RYUNIX_PORTAL`.
En lugar de añadir el componente evaluado localmente al `fiber.parent.dom` anterior, el motor expulsa físicamente los nodos DOM (`appendChild`) apuntándolos explícitamente al `containerInfo` objetivo adjunto a `document.body` o `#modal-root`.
A pesar de estar físicamente desconectados en el HTML, el Portal permanece conceptualmente dentro de la jerarquía de componentes Ryunix, heredando referencias `createContext` con seguridad.

### `forwardRef(render)` (`forwardRef.js`)
Debido a heurísticas internas del compilador, las propiedades `ref` son interceptadas y eliminadas por el motor core antes de llegar lógicamente a los bloques de ejecución de funciones de componente.
`forwardRef` extrae el trait reservado `ref` dinámicamente de los args del compilador y lo inyecta sin fricción como segundo argumento de función implícitamente `(props, ref) => {}`.
