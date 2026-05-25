/**
 * Public typings for `@unsetsoft/ryunixjs`.
 *
 * Runtime remains JavaScript (Rollup bundles in `dist/`). These declarations
 * cover the package entry, hooks, components, and SSR helpers exported from
 * `src/main.js`.
 */

// ---------------------------------------------------------------------------
// Virtual DOM
// ---------------------------------------------------------------------------

export type RyunixComponent<P = Record<string, unknown>> = (
  props: P,
) => RyunixNode

export type RyunixNode =
  | RyunixElement
  | string
  | number
  | boolean
  | null
  | undefined

export interface RyunixElement<
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  type: string | symbol | RyunixComponent<P>
  props: P & { children?: RyunixNode[] }
}

export type RyunixElementType =
  | string
  | symbol
  | RyunixComponent
  | { _contextId?: string }

export function createElement<P extends Record<string, unknown>>(
  type: RyunixElementType,
  props?: P | null,
  ...children: RyunixNode[]
): RyunixElement<P>

export function Fragment(props: {
  children?: RyunixNode | RyunixNode[]
}): RyunixElement

export function cloneElement<P extends Record<string, unknown>>(
  element: RyunixElement<P>,
  props?: Partial<P> | null,
  ...children: RyunixNode[]
): RyunixElement<P>

export function isValidElement(object: unknown): object is RyunixElement

// ---------------------------------------------------------------------------
// Client rendering
// ---------------------------------------------------------------------------

export interface RyunixRoot {
  dom: Element | DocumentFragment | null
  props: { children?: RyunixNode[] }
  alternate?: RyunixRoot | null
  isHydrating?: boolean
  hydrateCursor?: ChildNode | null
}

export function render(
  element: RyunixNode,
  container: Element | DocumentFragment,
): RyunixRoot

export function hydrate(
  element: RyunixNode,
  container: Element | DocumentFragment,
): RyunixRoot

export function init(
  MainElement: RyunixNode,
  root?: string,
  components?: Record<string, RyunixComponent>,
): RyunixRoot

export function safeRender<P extends Record<string, unknown>>(
  component: RyunixComponent<P>,
  props: P,
  onError?: (error: unknown) => void,
): RyunixNode

// ---------------------------------------------------------------------------
// Server rendering
// ---------------------------------------------------------------------------

export interface RyunixRenderToStringOptions {
  nonce?: string
}

export function escapeHtml(unsafe: string): string

export function renderToString(
  element: RyunixNode,
  options?: RyunixRenderToStringOptions,
): string

export function renderToStringAsync(
  element: RyunixNode,
  options?: RyunixRenderToStringOptions,
): Promise<string>

export function renderToReadableStream(
  element: RyunixNode,
  options?: RyunixRenderToStringOptions,
): ReadableStream<Uint8Array>

// ---------------------------------------------------------------------------
// Hooks — state
// ---------------------------------------------------------------------------

export type RyunixSetState<S> = (
  value: S | ((prev: S) => S),
  priority?: number,
) => void

export type RyunixDispatch<A> = (action: A, priority?: number) => void

export type RyunixReducer<S, A> = (state: S, action: A) => S

export function useStore<S>(
  initialState: S | (() => S),
  priority?: number,
): [S, RyunixSetState<S>]

export function useReducer<S, A>(
  reducer: RyunixReducer<S, A>,
  initialState: S,
  init?: (initial: S) => S,
  defaultPriority?: number,
): [S, RyunixDispatch<A>]

export function useStorePriority<S>(
  initialState: S | (() => S),
): [S, RyunixSetState<S>]

export function usePersistentStore<S extends string>(
  key: string,
  initialState?: S,
): [S, RyunixSetState<S>]

/** @deprecated Misspelled alias kept for backwards compatibility. */
export const usePersitentStore: typeof usePersistentStore

export function useSwitch(
  initialState?: boolean,
): [boolean, RyunixSetState<boolean>, () => void]

// ---------------------------------------------------------------------------
// Hooks — effects & memoization
// ---------------------------------------------------------------------------

export type RyunixEffectCallback = () => void | (() => void)

export function useEffect(
  callback: RyunixEffectCallback,
  deps?: readonly unknown[],
): void

export function useLayoutEffect(
  callback: RyunixEffectCallback,
  deps?: readonly unknown[],
): void

export function useRef<T>(initialValue: T): { current: T }

export function useMemo<T>(compute: () => T, deps?: readonly unknown[]): T

export function useCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  deps?: readonly unknown[],
): T

export function useDebounce<T>(value: T, delay?: number): T

export function useThrottle<T>(value: T, interval?: number): T

export function useTransition(): [
  boolean,
  (callback: () => void, priority?: number) => void,
]

export function useDeferredValue<T>(value: T): T

export function useId(): string

export function resetIdCounter(): void

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface RyunixContext<T> {
  Provider: RyunixComponent<{ value: T; children?: RyunixNode }>
  useContext: (ctxID?: string) => T
}

export function createContext<T>(
  contextId?: string,
  defaultValue?: T,
): RyunixContext<T>

// ---------------------------------------------------------------------------
// Hooks — document / URL
// ---------------------------------------------------------------------------

export function useQuery(): Record<string, string>

export function useHash(): string

export interface RyunixMetadataTags {
  title?: string
  pageTitle?: string
  canonical?: string
  [key: string]: string | undefined
}

export interface RyunixMetadataOptions {
  title?: {
    template?: string
    prefix?: string
  }
}

export function useMetadata(
  tags?: RyunixMetadataTags,
  options?: RyunixMetadataOptions,
): void

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export interface RyunixRouteProps {
  key?: string
  params?: Record<string, string | string[]>
  query?: Record<string, string>
  hash?: string
  location?: string
}

export interface RyunixRoute {
  path?: string
  component?: RyunixComponent<RyunixRouteProps>
  subRoutes?: RyunixRoute[]
  NotFound?: RyunixComponent
}

export interface RyunixRouterContext {
  location: string
  params: Record<string, string | string[]>
  query: Record<string, string>
  navigate: (path: string) => void
  route: RyunixRoute | null
}

export function RouterProvider(props: {
  routes: RyunixRoute[]
  children?: RyunixNode
}): RyunixNode

export function useRouter(): RyunixRouterContext

export function Children(): RyunixNode

export function usePathname(): string

export function useSearchParams(): URLSearchParams

export interface RyunixLinkProps extends Record<string, unknown> {
  to: string
  prefetch?: boolean
  className?: string
  'ryunix-class'?: string
}

export function Link(props: RyunixLinkProps): RyunixElement

export interface RyunixNavLinkProps extends RyunixLinkProps {
  exact?: boolean
}

export function NavLink(props: RyunixNavLinkProps): RyunixElement

// ---------------------------------------------------------------------------
// Components & boundaries
// ---------------------------------------------------------------------------

export function memo<P extends Record<string, unknown>>(
  Component: RyunixComponent<P>,
  arePropsEqual?: (prev: P, next: P) => boolean,
): RyunixComponent<P>

export function shallowEqual(
  prevProps: Record<string, unknown>,
  nextProps: Record<string, unknown>,
): boolean

export function deepEqual(a: unknown, b: unknown): boolean

export type RyunixLazyImport<P = Record<string, unknown>> = () => Promise<
  { default: RyunixComponent<P> } | RyunixComponent<P>
>

export function lazy<P extends Record<string, unknown>>(
  importFn: RyunixLazyImport<P>,
): RyunixComponent<P>

export function Suspense(props: {
  fallback?: RyunixNode
  children?: RyunixNode
}): RyunixNode

export function preload(
  importFn: RyunixLazyImport,
): Promise<{ default: RyunixComponent } | RyunixComponent>

export function forwardRef<P extends Record<string, unknown>>(
  render: (props: P, ref: unknown) => RyunixNode,
): RyunixComponent<P & { ref?: unknown }>

export function createPortal(
  children: RyunixNode,
  container: Element | DocumentFragment,
): RyunixElement | null

export function ErrorBoundary(props: {
  children?: RyunixNode
  fallback?: RyunixNode | ((error: unknown) => RyunixNode)
}): RyunixNode

export function ServerBoundary(props: {
  children?: RyunixNode
  id?: string
}): RyunixNode

export function Image(
  props: { src: string } & Record<string, unknown>,
): RyunixElement

export type RyunixMDXComponents = Record<string, RyunixComponent>

export function MDXContent(props: {
  children?: RyunixNode
  components?: RyunixMDXComponents
}): RyunixElement

export const MDXProvider: RyunixComponent<{
  value?: RyunixMDXComponents
  children?: RyunixNode
}>

export function useMDXComponents(): RyunixMDXComponents

export function getMDXComponents(
  components?: RyunixMDXComponents,
): RyunixMDXComponents

export const defaultComponents: RyunixMDXComponents

export function RyunixDevOverlay(propsOrError?: unknown): RyunixNode

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export const Priority: {
  readonly IMMEDIATE: 1
  readonly USER_BLOCKING: 2
  readonly NORMAL: 3
  readonly LOW: 4
  readonly IDLE: 5
}

export function batchUpdates(callback: () => void): void

export interface RyunixProfilerStats {
  total: number
  avg: number
  max: number
  min: number
  count: number
}

export interface RyunixProfilerComponentStats {
  name: string
  avg: number
  max: number
  count: number
}

export interface RyunixProfiler {
  enabled: boolean
  startMeasure(name: string): void
  endMeasure(name: string): number | undefined
  recordRender(componentName: string, duration: number): void
  getStats(): RyunixProfilerStats | null
  getSlowestComponents(limit?: number): RyunixProfilerComponentStats[]
  logStats(): void
  clear(): void
  enable(): void
  disable(): void
}

export const profiler: RyunixProfiler

export function useProfiler(componentName: string): () => void

export function withProfiler<P extends Record<string, unknown>>(
  Component: RyunixComponent<P>,
  name: string,
): RyunixComponent<P>

export function createActionProxy(
  actionId: string,
): (...args: unknown[]) => Promise<unknown>

/** @internal Re-exported for advanced tooling; not part of the stable public API. */
export function getState(): Record<string, unknown>

// ---------------------------------------------------------------------------
// Hooks namespace (`export * as Hooks`)
// ---------------------------------------------------------------------------

export namespace Hooks {
  export type SetState<S> = RyunixSetState<S>
  export type Dispatch<A> = RyunixDispatch<A>
  export type Reducer<S, A> = RyunixReducer<S, A>

  export const useStore: typeof useStore
  export const useReducer: typeof useReducer
  export const useEffect: typeof useEffect
  export const useLayoutEffect: typeof useLayoutEffect
  export const useRef: typeof useRef
  export const useMemo: typeof useMemo
  export const useCallback: typeof useCallback
  export const createContext: typeof createContext
  export const useQuery: typeof useQuery
  export const useHash: typeof useHash
  export const useMetadata: typeof useMetadata
  export const useId: typeof useId
  export const resetIdCounter: typeof resetIdCounter
  export const useDebounce: typeof useDebounce
  export const useThrottle: typeof useThrottle
  export const useStorePriority: typeof useStorePriority
  export const useTransition: typeof useTransition
  export const useDeferredValue: typeof useDeferredValue
  export const usePersistentStore: typeof usePersistentStore
  export const usePersitentStore: typeof usePersitentStore
  export const useSwitch: typeof useSwitch
  export const RouterProvider: typeof RouterProvider
  export const useRouter: typeof useRouter
  export const Children: typeof Children
  export const NavLink: typeof NavLink
  export const Link: typeof Link
  export const usePathname: typeof usePathname
  export const useSearchParams: typeof useSearchParams
}

declare const Ryunix: {
  createElement: typeof createElement
  Fragment: typeof Fragment
  cloneElement: typeof cloneElement
  isValidElement: typeof isValidElement
  render: typeof render
  init: typeof init
  safeRender: typeof safeRender
  hydrate: typeof hydrate
  renderToString: typeof renderToString
  renderToReadableStream: typeof renderToReadableStream
  escapeHtml: typeof escapeHtml
  renderToStringAsync: typeof renderToStringAsync
  useStore: typeof useStore
  useReducer: typeof useReducer
  useEffect: typeof useEffect
  useLayoutEffect: typeof useLayoutEffect
  useRef: typeof useRef
  useMemo: typeof useMemo
  useCallback: typeof useCallback
  createContext: typeof createContext
  useQuery: typeof useQuery
  useHash: typeof useHash
  useMetadata: typeof useMetadata
  useId: typeof useId
  resetIdCounter: typeof resetIdCounter
  useDebounce: typeof useDebounce
  useThrottle: typeof useThrottle
  useStorePriority: typeof useStorePriority
  useTransition: typeof useTransition
  useDeferredValue: typeof useDeferredValue
  usePersistentStore: typeof usePersistentStore
  usePersitentStore: typeof usePersitentStore
  useSwitch: typeof useSwitch
  RouterProvider: typeof RouterProvider
  useRouter: typeof useRouter
  Children: typeof Children
  NavLink: typeof NavLink
  Link: typeof Link
  usePathname: typeof usePathname
  useSearchParams: typeof useSearchParams
  Hooks: typeof Hooks
  memo: typeof memo
  shallowEqual: typeof shallowEqual
  deepEqual: typeof deepEqual
  lazy: typeof lazy
  Suspense: typeof Suspense
  preload: typeof preload
  batchUpdates: typeof batchUpdates
  Priority: typeof Priority
  profiler: typeof profiler
  useProfiler: typeof useProfiler
  withProfiler: typeof withProfiler
  forwardRef: typeof forwardRef
  createPortal: typeof createPortal
  ServerBoundary: typeof ServerBoundary
  ErrorBoundary: typeof ErrorBoundary
  getState: typeof getState
  createActionProxy: typeof createActionProxy
  RyunixDevOverlay: typeof RyunixDevOverlay
}

export default Ryunix
