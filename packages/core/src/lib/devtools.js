import { getState } from '../utils/index.js'

/**
 * Development warnings
 */
const isDevelopment = process.env.NODE_ENV !== 'production'

const warning = (condition, message) => {
  if (!isDevelopment) return
  if (condition) return
  console.warn(`[Ryunix Warning] ${message}`)
}

const error = (message) => {
  if (!isDevelopment) return
  console.error(`[Ryunix Error] ${message}`)
}

/**
 * Component name detection
 */
const getComponentName = (component) => {
  if (!component) return 'Unknown'
  return component.displayName || component.name || 'Anonymous'
}

/**
 * Hook call validation
 */
const validateHookContext = (hookName = 'A hook') => {
  const state = getState()
  if (!state.wipFiber) {
    throw new Error(
      `${hookName} can only be called inside function components. ` +
        'Make sure you are calling hooks at the top level of your component.',
    )
  }
  if (!Array.isArray(state.wipFiber.hooks)) {
    state.wipFiber.hooks = []
  }
}

/**
 * Performance tracking utilities
 */
const perfTracker = {
  marks: new Map(),

  mark(name) {
    if (!isDevelopment) return
    this.marks.set(name, Date.now())
  },

  measure(name, startMark) {
    if (!isDevelopment) return
    const start = this.marks.get(startMark)
    if (!start) return

    const duration = Date.now() - start
    console.log(`[Ryunix Performance] ${name}: ${duration}ms`)
  },

  clear() {
    this.marks.clear()
  },
}

/**
 * Deprecation warnings
 */
const deprecated = (oldAPI, newAPI, version) => {
  if (!isDevelopment) return
  console.warn(
    `[Ryunix Deprecated] ${oldAPI} is deprecated and will be removed in version ${version}. ` +
      `Use ${newAPI} instead.`,
  )
}

export {
  warning,
  error,
  getComponentName,
  validateHookContext,
  perfTracker,
  deprecated,
}
