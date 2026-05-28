/**
 * Hook — injected into the page; tracks fibers and posts events to the content script.
 */

;(function () {
  'use strict'

  if (window.__RYUNIX_DEVTOOLS_HOOK__) return

  const hook: RyunixDevtoolsHook = {
    fibers: new Map(),
    renderTimes: new Map(),

    recordFiber(fiber) {
      if (!fiber) return

      const startTime = performance.now()

      let typeName = 'Unknown'
      if (typeof fiber.type === 'function') {
        const fn = fiber.type as { name?: string; displayName?: string }
        typeName = fn.name || fn.displayName || 'Component'
      } else if (typeof fiber.type === 'string') {
        typeName = fiber.type
      }

      const fiberData: RyunixFiberRecord = {
        id: this.getFiberId(fiber),
        type: typeName,
        props: this.sanitizeProps(fiber.props),
        hooks: fiber.hooks?.length || 0,
        renderTime: 0,
      }

      this.fibers.set(fiber, fiberData)
      this.renderTimes.set(fiberData.id, startTime)
      this.emit('fiber', fiberData)
    },

    recordRenderComplete(fiber) {
      const fiberData = this.fibers.get(fiber)
      if (!fiberData) return

      const startTime = this.renderTimes.get(fiberData.id)
      if (startTime != null) {
        fiberData.renderTime = performance.now() - startTime
        this.emit('render', {
          id: fiberData.id,
          duration: fiberData.renderTime,
        })
      }
    },

    getFiberId(fiber) {
      if (!fiber.__devtoolsId) {
        fiber.__devtoolsId =
          'fiber_' + Math.random().toString(36).substring(2, 11)
      }
      return fiber.__devtoolsId
    },

    sanitizeProps(props) {
      if (!props) return {}

      const sanitized: Record<string, unknown> = {}
      for (const key in props) {
        if (key === 'children') continue

        const value = props[key]
        const type = typeof value

        if (type === 'function') {
          sanitized[key] = '[Function]'
        } else if (
          type === 'string' ||
          type === 'number' ||
          type === 'boolean'
        ) {
          sanitized[key] = value
        } else if (type === 'undefined') {
          sanitized[key] = 'undefined'
        } else if (value === null) {
          sanitized[key] = 'null'
        } else {
          sanitized[key] = '[Object]'
        }
      }
      return sanitized
    },

    emit(event, data) {
      window.postMessage(
        {
          source: 'ryunix-hook',
          payload: { event, data },
        },
        '*',
      )
    },

    highlightElement(fiberId) {
      const fiber = Array.from(this.fibers.entries()).find(
        ([, data]) => data.id === fiberId,
      )?.[0]

      if (!fiber?.dom) return

      const rect = fiber.dom.getBoundingClientRect()
      const overlay = document.getElementById('__ryunix_devtools_highlight__')

      if (overlay) {
        overlay.style.display = 'block'
        overlay.style.top = rect.top + 'px'
        overlay.style.left = rect.left + 'px'
        overlay.style.width = rect.width + 'px'
        overlay.style.height = rect.height + 'px'

        setTimeout(() => {
          overlay.style.display = 'none'
        }, 2000)
      }
    },
  }

  window.__RYUNIX_DEVTOOLS_HOOK__ = hook

  const tryAppendOverlay = (overlay: HTMLDivElement): void => {
    const parent = document.body || document.documentElement
    if (!parent) return
    if (!overlay.isConnected) parent.appendChild(overlay)
  }

  const overlay = document.createElement('div')
  overlay.id = '__ryunix_devtools_highlight__'
  overlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 2px solid #1976d2;
    background: rgba(25, 118, 210, 0.1);
    z-index: 999999;
    display: none;
  `
  tryAppendOverlay(overlay)
  document.addEventListener(
    'DOMContentLoaded',
    () => tryAppendOverlay(overlay),
    {
      once: true,
    },
  )

  const isElementLike = (value: unknown): value is RyunixFiberLike => {
    return Boolean(
      value &&
      typeof value === 'object' &&
      'type' in (value as Record<string, unknown>) &&
      'props' in (value as Record<string, unknown>),
    )
  }

  const walkTree = (node: unknown): void => {
    if (!isElementLike(node)) return
    hook.recordFiber(node)

    const children = node.props?.children
    if (Array.isArray(children)) {
      children.forEach((child) => walkTree(child))
    } else if (children != null) {
      walkTree(children)
    }
  }

  const patchRenderEntryPoint = (
    ryunix: RyunixGlobal,
    key: 'init' | 'render' | 'hydrate',
  ): void => {
    const target = ryunix[key]
    if (typeof target !== 'function') return

    const original = target
    ryunix[key] = function (...args: unknown[]) {
      const start = performance.now()
      const mainElement = args[0]
      walkTree(mainElement)
      hook.emit('init', { api: key, time: Date.now() })
      const result = original.apply(this, args)
      hook.emit('render', { api: key, duration: performance.now() - start })
      return result
    }
  }

  const patchRyunix = (ryunix: RyunixGlobal): void => {
    if (ryunix.__devtoolsPatched) return
    ryunix.__devtoolsPatched = true

    if (typeof ryunix.createElement !== 'function') {
      hook.emit('ready', { status: 'missing-createElement' })
      return
    }

    const originalCreateElement = ryunix.createElement
    ryunix.createElement = function (...args: unknown[]) {
      const element = originalCreateElement.apply(this, args) as RyunixFiberLike
      hook.recordFiber(element)
      return element
    }

    patchRenderEntryPoint(ryunix, 'init')
    patchRenderEntryPoint(ryunix, 'render')
    patchRenderEntryPoint(ryunix, 'hydrate')

    hook.emit('ready', { status: 'ok' })
  }

  const current = window.Ryunix
  if (current) {
    patchRyunix(current)
    return
  }

  try {
    let ryunixRef: RyunixGlobal | undefined
    Object.defineProperty(window, 'Ryunix', {
      configurable: true,
      get() {
        return ryunixRef
      },
      set(value: RyunixGlobal | undefined) {
        ryunixRef = value
        if (value) patchRyunix(value)
      },
    })
  } catch (_error) {
    const poll = (): void => {
      if (!window.Ryunix) {
        setTimeout(poll, 100)
        return
      }
      patchRyunix(window.Ryunix)
    }
    poll()
  }
})()
