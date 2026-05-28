import { getState } from '../../utils/index.js'

const PREFIX = '[Ryunix Hydration]'

const emit = (level: 'warn' | 'error', message: string) => {
  const line = `${PREFIX} ${message}`
  if (level === 'error') {
    console.error(line)
  } else {
    console.warn(line)
  }
}

const shouldReportStrict = () =>
  process.env.NODE_ENV !== 'production' &&
  process.env.RYUNIX_HYDRATION_STRICT === 'true'

export const logHydrationInfo = (message: string) => {
  if (!shouldReportStrict()) return
  emit('warn', message)
}

/**
 * Log the first hydration DOM mismatch (tag/text vs client tree).
 */
export const logHydrationMismatch = (detail: string) => {
  const state = getState()
  if (state.hydrationMismatchReported) return
  state.hydrationMismatchReported = true

  const level = process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  emit(
    level,
    `${detail} Server HTML did not match the client render. Falling back to client-side render.`,
  )
}

export const logHydrationBoundaryMismatch = (detail: string) => {
  const state = getState()
  if (state.hydrationBoundaryMismatchReported) return
  state.hydrationBoundaryMismatchReported = true
  const level = process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  emit(
    level,
    `${detail} Recovering the nearest hydration boundary with a scoped client render.`,
  )
}

export const logHydrationRecoverable = (detail: string) => {
  if (!shouldReportStrict()) return
  emit(
    'warn',
    `Recovered a hydration mismatch (${detail}) without root fallback.`,
  )
}

/**
 * Log when hydration failed and the SSR container is being cleared.
 */
export const logHydrationFailure = (reason = '') => {
  const state = getState()
  if (state.hydrationFailureReported) return
  state.hydrationFailureReported = true

  const detail = reason
    ? `${reason} `
    : state.hydrationMismatchReported
      ? ''
      : 'Hydration could not attach to the server HTML. '

  const level = process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  emit(level, `${detail}Clearing #__ryunix and remounting on the client.`)
}

/**
 * Log when leftover SSR nodes are removed after hydration (soft mismatch).
 */
export const logHydrationUnmatchedNodes = (count: number) => {
  if (!count) return
  const state = getState()
  if (state.hydrationUnmatchedReported) return
  state.hydrationUnmatchedReported = true

  emit(
    'warn',
    `Removed ${count} server-rendered DOM node(s) that were not used by the client tree. This can indicate an SSR/client markup mismatch.`,
  )
}

/** Log CSR recovery after a failed hydration pass. */
export const logHydrationRecovery = () => {
  const state = getState()
  if (state.hydrationRecoveryReported) return
  state.hydrationRecoveryReported = true

  emit(
    'warn',
    'Remounting the application on the client after hydration failure.',
  )
}

/** Log scoped boundary recovery after a local mismatch. */
export const logHydrationBoundaryRecovery = () => {
  const state = getState()
  if (state.hydrationBoundaryRecoveryReported) return
  state.hydrationBoundaryRecoveryReported = true
  emit('warn', 'Remounting a hydration boundary after local mismatch.')
}

export const logHydrationFatal = (reason: string) => {
  emit('error', reason)
}

/** Reset per-mount hydration log flags (call from init). */
export const resetHydrationLogFlags = () => {
  const state = getState()
  state.hydrationMismatchReported = false
  state.hydrationBoundaryMismatchReported = false
  state.hydrationFailureReported = false
  state.hydrationUnmatchedReported = false
  state.hydrationRecoveryReported = false
  state.hydrationBoundaryRecoveryReported = false
}
