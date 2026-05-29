/**
 * Public API surface of `@unsetsoft/ryunixjs`.
 * Re-exports createElement, hooks, render, SSR helpers, and related utilities.
 *
 * @module lib/index
 */

export {
  createElement,
  Fragment,
  cloneElement,
  isValidElement,
} from './reconciler/createElement.js'
export { render, init, safeRender, hydrate } from './render/render.js'
export {
  renderToString,
  renderToReadableStream,
  escapeHtml,
  renderToStringAsync,
} from './server/ssr.js'
export * from './hooks/index.js'
export * as Hooks from './hooks/index.js'
export { batchUpdates } from './reconciler/batching.js'
export { Priority } from './reconciler/priority.js'
export { profiler, useProfiler, withProfiler } from './devtools/profiler.js'
export { createPortal } from './render/portal.js'
export { ServerBoundary, HydrationBoundary } from './hydration/boundaries.js'
export { ErrorBoundary } from './ui/error-boundary.js'
export {
  logHydrationInfo,
  logHydrationRecoverable,
  logHydrationBoundaryMismatch,
  logHydrationBoundaryRecovery,
  logHydrationFatal,
} from './hydration/log.js'
export { getState } from '../utils/index.js'
export { createActionProxy } from './server/actions.js'
export { RyunixDevOverlay } from './ui/dev-overlay.js'
export {
  createThemeController,
  themeController,
  DEFAULT_THEME_COOKIE_NAME,
  THEME_PREFERENCES,
  getThemeCookie,
  setThemeCookie,
  resolveThemeFromCookie,
  getSystemColorScheme,
  resolveEffectiveTheme,
  applyTheme,
  watchSystemTheme,
  themeInitScript,
} from './ui/theme.js'
export { ThemeToggle, ThemeInitScript } from './ui/theme-toggle.js'
export { Header, Footer, Main } from './ui/layout.js'
export {
  createI18n,
  createAppI18n,
  createI18nFromConfig,
  defineMessages,
  getRyunixI18nConfig,
  DEFAULT_LOCALE_COOKIE_NAME,
  getLocaleFromPath,
  localePath,
  pickLocale,
  swapLocalePath,
  normalizeI18nConfig,
} from './i18n/index.js'
