/**
 * Hook - Improved with performance tracking
 */

(function () {
  'use strict'

  if (window.__RYUNIX_DEVTOOLS_HOOK__) return

  const hook = {
    fibers: new Map(),
    renderTimes: new Map(),

    recordFiber(fiber) {
      if (!fiber) return

      const startTime = performance.now()

      // Handle fiber.type safely
      let typeName = 'Unknown'
      if (typeof fiber.type === 'function') {
        typeName = fiber.type.name || fiber.type.displayName || 'Component'
      } else if (typeof fiber.type === 'string') {
        typeName = fiber.type
      }

      const fiberData = {
        id: this.getFiberId(fiber),
        type: typeName,
        props: this.sanitizeProps(fiber.props),
        hooks: fiber.hooks?.length || 0,
        renderTime: 0
      }

      this.fibers.set(fiber, fiberData)
      this.renderTimes.set(fiberData.id, startTime)
      this.emit('fiber', fiberData)
    },

    recordRenderComplete(fiber) {
      const fiberData = this.fibers.get(fiber)
      if (!fiberData) return

      const startTime = this.renderTimes.get(fiberData.id)
      if (startTime) {
        const duration = performance.now() - startTime
        fiberData.renderTime = duration
        this.emit('render', { id: fiberData.id, duration })
      }
    },

    getFiberId(fiber) {
      if (!fiber.__devtoolsId) {
        fiber.__devtoolsId = 'fiber_' + Math.random().toString(36).substr(2, 9)
      }
      return fiber.__devtoolsId
    },

    sanitizeProps(props) {
      if (!props) return {}

      const sanitized = {}
      for (const key in props) {
        if (key === 'children') continue

        const value = props[key]
        const type = typeof value

        if (type === 'function') {
          sanitized[key] = '[Function]'
        } else if (type === 'string' || type === 'number' || type === 'boolean') {
          sanitized[key] = value
        } else if (type === 'undefined') {
          sanitized[key] = 'undefined'
        } else if (value === null) {
          sanitized[key] = 'null'
        } else {
          // Objects/arrays - convert to string safely
          sanitized[key] = '[Object]'
        }
      }
      return sanitized
    },

    emit(event, data) {
      window.postMessage({
        source: 'ryunix-hook',
        payload: { event, data }
      }, '*')
    },

    // Highlight element in page
    highlightElement(fiberId) {
      const fiber = Array.from(this.fibers.entries())
        .find(([_, data]) => data.id === fiberId)?.[0]

      if (!fiber?.dom) return

      const rect = fiber.dom.getBoundingClientRect()
      const overlay = document.getElementById('__ryunix_devtools_highlight__')

      if (overlay) {
        overlay.style.display = 'block'
        overlay.style.top = rect.top + 'px'
        overlay.style.left = rect.left + 'px'
        overlay.style.width = rect.width + 'px'
        overlay.style.height = rect.height + 'px'

        setTimeout(() => overlay.style.display = 'none', 2000)
      }
    }
  }

  window.__RYUNIX_DEVTOOLS_HOOK__ = hook

  // Create highlight overlay
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

  // Patch Ryunix
  const patchRyunix = () => {
    if (!window.Ryunix) {
      setTimeout(patchRyunix, 100)
      return
    }

    const originalCreateElement = window.Ryunix.createElement
    window.Ryunix.createElement = function (...args) {
      const element = originalCreateElement.apply(this, args)
      hook.recordFiber(element)
      return element
    }

    if (window.Ryunix.init) {
      const originalInit = window.Ryunix.init
      window.Ryunix.init = function (...args) {
        hook.emit('init', { time: Date.now() })
        return originalInit.apply(this, args)
      }
    }

    hook.emit('ready', { version: '1.3.0' })
  }

  patchRyunix()
})()