/**
 * Ambient types for .ryx files (Ryunix JSX + global Ryunix from Webpack ProvidePlugin).
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
  export interface LinkProps {
    to: string
    className?: string
    children?: unknown
    [key: string]: unknown
  }

  export interface NavLinkProps extends LinkProps {
    activeClassName?: string
  }

  export function Link(props: LinkProps): unknown
  export function NavLink(props: NavLinkProps): unknown

  export function useStore<T>(initial?: T): [T, (v: T | ((p: T) => T)) => void]
  export function useRouter(): {
    location: string
    navigate: (path: string) => void
    route: unknown
  }
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
  export const RouterProvider: (props: { children?: unknown }) => unknown
  export const ServerBoundary: (props: { children?: unknown }) => unknown
  export const Suspense: (props: {
    children?: unknown
    fallback?: unknown
  }) => unknown
  export function lazy(loader: () => Promise<{ default: unknown }>): unknown
  export function memo<T>(component: T): T
  const _default: typeof Ryunix
  export default _default
}
