<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/UnSetSoft/Ryunixjs/canary/assets/logo.png" width="200" height="200" alt="RyunixJS Logo" />
</p>

<h1 align="center">@unsetsoft/ryunixjs</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@unsetsoft/ryunixjs">
    <img src="https://img.shields.io/npm/v/@unsetsoft/ryunixjs.svg?style=flat-square" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@unsetsoft/ryunixjs/v/canary">
    <img src="https://img.shields.io/npm/v/@unsetsoft/ryunixjs/canary.svg?style=flat-square&label=canary" alt="canary version" />
  </a>
</p>

## <!-- markdownlint-enable MD013 -->

## 🧠 What is the Core?

`@unsetsoft/ryunixjs` is the **foundational engine** of the RyunixJS framework.
It's a lightweight, high-performance library responsible for:

- **Reconciliation & Fiber Architecture**: Efficiently updating the DOM by

  comparing Virtual DOM trees.

- **Hooks System**: Providing the core state and lifecycle management (e.g.,

  `useStore`, `useEffect`).

- **Concurrent Rendering**: Support for prioritized updates and transitions.
- **SSR & Hydration**: Server-Side Rendering engines for both Node.js and Edge

  environments.

While you can use it standalone for custom integrations, it is typically used
via `@unsetsoft/ryunix-presets` and our official CLI.

## 🚀 Installation

```bash
npm install @unsetsoft/ryunixjs
```

## 🛠️ API Reference

### Core Functions

- `createElement(type, props, ...children)`: Creates a Virtual DOM element.
- `render(element, container)`: Renders a Ryunix element into the DOM.
- `hydrate(element, container)`: Hydrates server-rendered HTML.
- `init()`: Initializes the Ryunix state.

### Hooks

| Hook                           | Description                                         |
| :----------------------------- | :-------------------------------------------------- |
| `useStore(initial)`            | State management (Ryunix equivalent of `useState`). |
| `useReducer(reducer, initial)` | Advanced state management with reducers.            |
| `useEffect(cb, deps)`          | Side effects management.                            |
| `useLayoutEffect(cb, deps)`    | Synchronous side effects before browser paint.      |
| `useRef(initial)`              | Persistent reference across renders.                |
| `useMemo(cb, deps)`            | Memoized values.                                    |
| `useCallback(cb, deps)`        | Memoized functions.                                 |
| `useContext(id)`               | Consumes a context value.                           |
| `useId()`                      | Generates unique, stable IDs for SSR.               |

### Specialized Hooks

- `usePersistentStore(key, initial)`: Automatically syncs state with

  `localStorage`.

- `useSwitch(initial)`: Optimized toggle state hook.
- `useDebounce(value, delay)`: Debounces a value update.
- `useThrottle(value, interval)`: Throttles value updates.
- `useQuery()` / `useHash()`: Reactive URL parameters and hash.

### Concurrency & Server-Side

- **Prioritized Updates**: Use `useTransition` and `useDeferredValue` to manage

  non-urgent UI updates.

- **SSR Engine**: `renderToString` and `renderToReadableStream` for flexible

  server rendering.

- **Boundaries**: `ServerBoundary` and `ErrorBoundary` for resilient

  applications.

## 🏗️ Example Usage

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

## 📄 License

RyunixJS is [MIT Licensed](../../LICENSE).
