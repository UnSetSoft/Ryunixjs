import { getState } from '../../utils/index.js'
import type { RyunixComponent, RyunixFiber } from '../../types/internal.js'

/**
 * Development warnings
 */
const isDevelopment = process.env.NODE_ENV !== 'production'

const warning = (condition: boolean, message: string) => {
  if (!isDevelopment) return
  if (condition) return
  console.warn(`[Ryunix Warning] ${message}`)
}

const error = (message: string) => {
  if (!isDevelopment) return
  console.error(`[Ryunix Error] ${message}`)
}

const getComponentName = (
  component: RyunixComponent | null | undefined,
): string => {
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
  const wipFiber = state.wipFiber as RyunixFiber
  if (!Array.isArray(wipFiber.hooks)) {
    wipFiber.hooks = []
  }
}

/**
 * Performance tracking utilities
 */
const perfTracker = {
  marks: new Map<string, number>(),

  mark(name: string) {
    if (!isDevelopment) return
    this.marks.set(name, Date.now())
  },

  measure(name: string, startMark: string) {
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
const deprecated = (oldAPI: string, newAPI: string, version: string) => {
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
