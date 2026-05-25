<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/UnSetSoft/Ryunixjs/canary/assets/logo.png" width="200" height="200" alt="RyunixJS Logo" />
</p>

<h1 align="center">@unsetsoft/ryunixjs</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@unsetsoft/ryunixjs">
    <img src="https://img.shields.io/npm/v/@unsetsoft/ryunixjs.svg?style=flat-square" alt="versión npm" />
  </a>
  <a href="https://www.npmjs.com/package/@unsetsoft/ryunixjs/v/canary">
    <img src="https://img.shields.io/npm/v/@unsetsoft/ryunixjs/canary.svg?style=flat-square&label=canary" alt="versión canary" />
  </a>
</p>

## <!-- markdownlint-enable MD013 -->

## 🧠 ¿Qué es el Core?

`@unsetsoft/ryunixjs` es el **motor fundamental** del framework RyunixJS.
Es una biblioteca ligera y de alto rendimiento responsable de:

- **Reconciliación y arquitectura Fiber**: actualiza el DOM de forma eficiente

  comparando árboles de Virtual DOM.

- **Sistema de hooks**: gestión de estado y ciclo de vida (p. ej.

  `useStore`, `useEffect`).

- **Renderizado concurrente**: soporte para actualizaciones priorizadas y transiciones.
- **SSR e hidratación**: motores de renderizado en servidor para Node.js y entornos

  Edge.

Aunque puedes usarlo de forma independiente en integraciones personalizadas, lo habitual
es consumirlo mediante `@unsetsoft/ryunix-presets` y el CLI oficial.

## 📘 TypeScript

Los tipos están en `types/index.d.ts` (entrada principal) y
`jsx/jsx-runtime.d.ts` (JSX automático). Instala `@unsetsoft/ryunixjs` como
dependencia; no hace falta un paquete `@types` aparte.

```typescript
import {
  useStore,
  createElement,
  type RyunixElement,
} from '@unsetsoft/ryunixjs'

function Counter(): RyunixElement {
  const [count, setCount] = useStore(0)
  return createElement('button', { onClick: () => setCount(count + 1) }, count)
}
```

Para JSX, configura `"jsxImportSource": "@unsetsoft/ryunixjs"` en tu
`tsconfig.json` (o usa el preset Webpack/SWC de Ryunix, que lo aplica en
archivos `.ryx`).

## 🚀 Instalación

```bash
npm install @unsetsoft/ryunixjs
```

## 🛠️ Referencia de API

### Funciones principales

- `createElement(type, props, ...children)`: crea un elemento de Virtual DOM.
- `render(element, container)`: renderiza un elemento Ryunix en el DOM.
- `hydrate(element, container)`: hidrata HTML generado en servidor.
- `init()`: inicializa el estado de Ryunix.

### Hooks

| Hook                           | Descripción                                           |
| :----------------------------- | :---------------------------------------------------- |
| `useStore(initial)`            | Gestión de estado (equivalente Ryunix de `useState`). |
| `useReducer(reducer, initial)` | Estado avanzado con reducers.                         |
| `useEffect(cb, deps)`          | Efectos secundarios.                                  |
| `useLayoutEffect(cb, deps)`    | Efectos síncronos antes del pintado del navegador.    |
| `useRef(initial)`              | Referencia persistente entre renders.                 |
| `useMemo(cb, deps)`            | Valores memorizados.                                  |
| `useCallback(cb, deps)`        | Funciones memorizadas.                                |
| `useContext(id)`               | Consume un valor de contexto.                         |
| `useId()`                      | Genera IDs únicos y estables para SSR.                |

### Hooks especializados

- `usePersistentStore(key, initial)`: sincroniza el estado con

  `localStorage` automáticamente.

- `useSwitch(initial)`: hook optimizado para estado booleano.
- `useDebounce(value, delay)`: aplaza actualizaciones de un valor.
- `useThrottle(value, interval)`: limita la frecuencia de actualizaciones.
- `useQuery()` / `useHash()`: parámetros de URL y hash reactivos.

### Concurrencia y servidor

- **Actualizaciones priorizadas**: usa `useTransition` y `useDeferredValue` para

  actualizaciones de UI no urgentes.

- **Motor SSR**: `renderToString` y `renderToReadableStream` para renderizado

  flexible en servidor.

- **Límites**: `ServerBoundary` y `ErrorBoundary` para aplicaciones resilientes.

## 🏗️ Ejemplo de uso

```javascript
import { render, useStore, createElement } from '@unsetsoft/ryunixjs'

function App() {
  const [count, setCount] = useStore(0)

  return createElement(
    'div',
    null,
    createElement('h1', null, `Count: ${count}`),
    createElement(
      'button',
      { onClick: () => setCount(count + 1) },
      'Increment',
    ),
  )
}

render(createElement(App), document.getElementById('root'))
```

## 📄 Licencia

RyunixJS tiene [licencia MIT](../../LICENSE).
