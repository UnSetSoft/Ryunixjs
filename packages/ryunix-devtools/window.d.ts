/** Page-context globals used by the injected Ryunix DevTools hook. */

declare global {
  interface RyunixFiberLike {
    type: string | { name?: string; displayName?: string }
    props?: Record<string, unknown>
    hooks?: unknown[]
    dom?: Element
    __devtoolsId?: string
  }

  interface RyunixFiberRecord {
    id: string
    type: string
    props: Record<string, unknown>
    hooks: number
    renderTime: number
  }

  interface RyunixDevtoolsHook {
    fibers: Map<RyunixFiberLike, RyunixFiberRecord>
    renderTimes: Map<string, number>
    recordFiber(fiber: RyunixFiberLike): void
    recordRenderComplete(fiber: RyunixFiberLike): void
    getFiberId(fiber: RyunixFiberLike): string
    sanitizeProps(
      props: Record<string, unknown> | undefined,
    ): Record<string, unknown>
    emit(event: string, data: unknown): void
    highlightElement(fiberId: string): void
  }

  interface RyunixGlobal {
    createElement: (...args: unknown[]) => unknown
    init?: (...args: unknown[]) => unknown
  }

  interface Window {
    __RYUNIX_DEVTOOLS_HOOK__?: RyunixDevtoolsHook
    Ryunix?: RyunixGlobal
  }
}

export {}
