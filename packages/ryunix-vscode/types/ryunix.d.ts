/**
 * Ambient types for .ryx files (Ryunix JSX + global Ryunix from Webpack ProvidePlugin).
 * Referenced by jsconfig.json in Ryunix apps and by the language server.
 */
declare namespace Ryunix {
  function createElement(
    type: unknown,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ): unknown
  const Fragment: unique symbol
  function init(tree: unknown): void
  function render(tree: unknown, container: unknown): void
  function hydrate(tree: unknown, container: unknown): void
}

declare const Ryunix: typeof Ryunix

declare module '@unsetsoft/ryunixjs' {
  export function useStore<T>(initial?: T): [T, (v: T | ((p: T) => T)) => void]
  export function useEffect(
    effect: () => void | (() => void),
    deps?: unknown[],
  ): void
  export function useMemo<T>(factory: () => T, deps?: unknown[]): T
  export function useCallback<T extends (...args: unknown[]) => unknown>(
    fn: T,
    deps?: unknown[],
  ): T
  export function useRef<T>(initial: T): { current: T }
  export const Link: (props: Record<string, unknown>) => unknown
  export const NavLink: (props: Record<string, unknown>) => unknown
  export const RouterProvider: (props: Record<string, unknown>) => unknown
  export const ServerBoundary: (props: Record<string, unknown>) => unknown
  export const Suspense: (props: Record<string, unknown>) => unknown
  export function lazy(
    loader: () => Promise<{ default: unknown }>,
  ): unknown
  export function memo<T>(component: T): T
  const _default: typeof Ryunix
  export default _default
}
