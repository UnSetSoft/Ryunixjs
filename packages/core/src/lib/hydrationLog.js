import { getState } from '../utils/index.js'
const PREFIX = '[Ryunix Hydration]'
const emit = (level, message) => {
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
export const logHydrationInfo = (message) => {
  if (!shouldReportStrict()) return
  emit('warn', message)
}
export const logHydrationMismatch = (detail) => {
  const state = getState()
  if (state.hydrationMismatchReported) return
  state.hydrationMismatchReported = true
  const level = process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  emit(
    level,
    `${detail} Server HTML did not match the client render. Falling back to client-side render.`,
  )
}
export const logHydrationBoundaryMismatch = (detail) => {
  const state = getState()
  if (state.hydrationBoundaryMismatchReported) return
  state.hydrationBoundaryMismatchReported = true
  const level = process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  emit(
    level,
    `${detail} Recovering the nearest hydration boundary with a scoped client render.`,
  )
}
export const logHydrationRecoverable = (detail) => {
  if (!shouldReportStrict()) return
  emit(
    'warn',
    `Recovered a hydration mismatch (${detail}) without root fallback.`,
  )
}
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
export const logHydrationUnmatchedNodes = (count) => {
  if (!count) return
  const state = getState()
  if (state.hydrationUnmatchedReported) return
  state.hydrationUnmatchedReported = true
  emit(
    'warn',
    `Removed ${count} server-rendered DOM node(s) that were not used by the client tree. This can indicate an SSR/client markup mismatch.`,
  )
}
export const logHydrationRecovery = () => {
  const state = getState()
  if (state.hydrationRecoveryReported) return
  state.hydrationRecoveryReported = true
  emit(
    'warn',
    'Remounting the application on the client after hydration failure.',
  )
}
export const logHydrationBoundaryRecovery = () => {
  const state = getState()
  if (state.hydrationBoundaryRecoveryReported) return
  state.hydrationBoundaryRecoveryReported = true
  emit('warn', 'Remounting a hydration boundary after local mismatch.')
}
export const logHydrationFatal = (reason) => {
  emit('error', reason)
}
export const resetHydrationLogFlags = () => {
  const state = getState()
  state.hydrationMismatchReported = false
  state.hydrationBoundaryMismatchReported = false
  state.hydrationFailureReported = false
  state.hydrationUnmatchedReported = false
  state.hydrationRecoveryReported = false
  state.hydrationBoundaryRecoveryReported = false
}
