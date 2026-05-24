/**
 * Internal Ryunix reconciler / hook types (maintainer-only, not published).
 */

export type RyunixNode =
  | string
  | number
  | boolean
  | null
  | undefined
  | RyunixElement
  | RyunixTextElement

export interface RyunixElement {
  type: string | symbol | Function
  props: Record<string, unknown> & { children?: RyunixNode[] }
  key?: string | number
}

export interface RyunixTextElement {
  type: symbol
  props: { nodeValue: string; children: RyunixNode[] }
}

export interface RyunixComponent {
  (...args: never[]): RyunixNode
  ryunix_type?: string
  displayName?: string
  name?: string
  _isLazy?: boolean
  _getStatus?: () => string
  _isMemo?: boolean
  _contextId?: string | symbol
}

export interface RyunixHook {
  hookID?: number
  type?: symbol
  state?: unknown
  queue?: unknown[]
  cancel?: (() => void) | null
  deps?: unknown[]
  effect?: () => void | (() => void)
  ref?: { current: unknown }
  memoizedValue?: unknown
  callback?: (...args: never[]) => unknown
}

export interface RyunixFiber {
  type?: string | symbol | RyunixComponent | object
  props?: Record<string, unknown> & { children?: RyunixNode[] }
  dom?: HTMLElement | Text | null
  parent?: RyunixFiber | null
  child?: RyunixFiber | null
  sibling?: RyunixFiber | null
  alternate?: RyunixFiber | null
  hooks?: RyunixHook[]
  effectTag?: symbol
  key?: string | number
  index?: number
  stateError?: unknown
  _contextId?: string | symbol
  _contextValue?: unknown
  _isMemo?: boolean
  _isLazy?: boolean
  _isForwardRef?: boolean
  _arePropsEqual?: (prev: Record<string, unknown>, next: Record<string, unknown>) => boolean
  containerInfo?: Element | DocumentFragment
  _isPortal?: boolean
  __devtoolsId?: string
}

export interface RyunixRootFiber extends RyunixFiber {
  dom: Element | DocumentFragment
  isHydrating?: boolean
  hydrateCursor?: ChildNode | null
}

export interface RyunixSuspenseTask {
  (): Promise<{ success: boolean; id: string; content: string }>
}

export interface RyunixRenderToStringOptions {
  nonce?: string
}

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

export interface RyunixRoute {
  path?: string
  component?: RyunixComponent
  subRoutes?: RyunixRoute[]
  NotFound?: RyunixComponent
}

export interface RyunixRouterContextValue {
  location: string
  params: Record<string, string | string[]>
  query: Record<string, string>
  navigate: (path: string) => void
  route: RyunixRoute | null
}

export type ScheduleWorkFn = (
  root: RyunixRootFiber,
  priority?: number,
) => void

export interface RyunixDomElement extends HTMLElement {
  _ryunixHandlers?: Record<string, EventListener>
}

declare global {
  interface Window {
    __RYUNIX_MPA__?: boolean
    __RYUNIX_DEVTOOLS_HOOK__?: unknown
    Ryunix?: unknown
  }

  interface Error {
    __ryunix_source?: { fileName?: string; lineNumber?: number }
  }
}
