/**
 * Hook Script - Version con debugging
 */

(function () {
  'use strict'

  console.log('[Ryunix DevTools] Hook iniciando...')

  if (window.__RYUNIX_DEVTOOLS_HOOK__) {
    console.log('[Ryunix DevTools] Hook ya existe')
    return
  }

  const hook = {
    fibers: new Map(),

    recordFiber(fiber) {
      if (!fiber) return

      const fiberData = {
        id: this.getFiberId(fiber),
        type: fiber.type?.name || fiber.type || 'Unknown',
        props: this.sanitizeProps(fiber.props),
        hooks: fiber.hooks?.length || 0
      }

      this.fibers.set(fiber, fiberData)
      this.emit('fiber', fiberData)

    },

    getFiberId(fiber) {
      if (!fiber.__id) {
        fiber.__id = 'fiber_' + Math.random().toString(36).substr(2, 9)
      }
      return fiber.__id
    },

    sanitizeProps(props) {
      if (!props) return {}

      const sanitized = {}
      for (const key in props) {
        if (key === 'children') continue

        const value = props[key]
        if (typeof value === 'function') {
          sanitized[key] = '[Function]'
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = '[Object]'
        } else {
          sanitized[key] = value
        }
      }
      return sanitized
    },

    emit(event, data) {
      window.postMessage({
        source: 'ryunix-hook',
        payload: { event, data }
      }, '*')
    }
  }

  window.__RYUNIX_DEVTOOLS_HOOK__ = hook
  console.log('[Ryunix DevTools] Hook instalado')

  // Patch Ryunix
  const patchRyunix = () => {
    if (!window.Ryunix) {
      console.log('[Ryunix DevTools] Esperando Ryunix...')
      setTimeout(patchRyunix, 100)
      return
    }

    console.log('[Ryunix DevTools] Ryunix detectado, aplicando patches')

    // Patch createElement
    const originalCreateElement = window.Ryunix.createElement
    window.Ryunix.createElement = function (...args) {
      const element = originalCreateElement.apply(this, args)
      hook.recordFiber(element)
      return element
    }

    // Patch init
    if (window.Ryunix.init) {
      const originalInit = window.Ryunix.init
      window.Ryunix.init = function (...args) {
        console.log('[Ryunix DevTools] App inicializada')
        hook.emit('init', { time: Date.now() })
        return originalInit.apply(this, args)
      }
    }

    hook.emit('ready', { version: '1.3.0' })
    console.log('[Ryunix DevTools] Patches aplicados correctamente')
  }

  patchRyunix()
})()