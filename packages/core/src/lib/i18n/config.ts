import type { RyunixI18nConfig } from './types.js'

/**
 * Injected at build time as `ryunix.config.i18n` via DefinePlugin
 * (`@unsetsoft/ryunix-presets`). Keep the member access identical to that key.
 */
declare const ryunix: { config: { i18n: RyunixI18nConfig | null } }

/** Read `i18n` from `ryunix.config.js` (build-time injection). */
export function getRyunixI18nConfig(): RyunixI18nConfig | null {
  try {
    const value = ryunix.config.i18n
    if (value && Array.isArray(value.locales) && value.locales.length > 0) {
      return value
    }
  } catch {
    // Not in a Ryunix bundle (tests, Node scripts)
  }
  return null
}
