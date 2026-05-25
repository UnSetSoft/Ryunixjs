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
  document.body.appendChild(overlay)

  const patchRyunix = (): void => {
    if (!window.Ryunix) {
      setTimeout(patchRyunix, 100)
      return
    }

    const ryunix = window.Ryunix
    const originalCreateElement = ryunix.createElement
    ryunix.createElement = function (...args: unknown[]) {
      const element = originalCreateElement.apply(this, args) as RyunixFiberLike
      hook.recordFiber(element)
      return element
    }

    if (ryunix.init) {
      const originalInit = ryunix.init
      ryunix.init = function (...args: unknown[]) {
        hook.emit('init', { time: Date.now() })
        return originalInit.apply(this, args)
      }
    }

    hook.emit('ready', { status: 'ok' })
  }

  patchRyunix()
})()
