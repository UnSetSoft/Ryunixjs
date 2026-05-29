export interface LocalePathOptions {
  locales: readonly string[]
  defaultLocale: string
}

export function normalizeI18nConfig<
  T extends { locales: readonly string[]; defaultLocale: string },
>(config: T): T & { locales: readonly string[]; defaultLocale: string } {
  const locales = [...new Set(config.locales.filter(Boolean))]
  if (locales.length === 0) {
    throw new Error('[Ryunix i18n] At least one locale is required.')
  }
  const defaultLocale = locales.includes(config.defaultLocale)
    ? config.defaultLocale
    : locales[0]
  return { ...config, locales, defaultLocale }
}

/** Pick a locale slice from a record (`{ en: {...}, es: {...} }`). */
export function pickLocale<T>(
  record: Record<string, T> | null | undefined,
  locale: string,
  fallback: string,
): T | undefined {
  return record?.[locale] ?? record?.[fallback]
}

export function getLocaleFromPath(
  pathname: string,
  locales: readonly string[],
): string | null {
  if (typeof pathname !== 'string' || locales.length === 0) return null
  const pattern = new RegExp(`^/(${locales.map(escapeRegExp).join('|')})(/|$)`)
  const match = pathname.match(pattern)
  return match ? match[1] : null
}

export function localePath(
  locale: string,
  path = '',
  locales: readonly string[],
): string {
  const normalized = path.startsWith('/') ? path : path ? `/${path}` : ''
  if (!locales.includes(locale)) return normalized || '/'
  if (!normalized || normalized === '/') return `/${locale}`
  return `/${locale}${normalized}`
}

export function swapLocalePath(
  pathname: string,
  targetLocale: string,
  options: LocalePathOptions,
): string {
  const { locales } = options
  if (!locales.includes(targetLocale)) return pathname

  const current = getLocaleFromPath(pathname, locales)
  if (current) {
    const rest = pathname.slice(current.length + 1) || ''
    return localePath(targetLocale, rest, locales)
  }

  if (pathname.startsWith('/')) {
    return localePath(targetLocale, pathname, locales)
  }

  return localePath(targetLocale, '', locales)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
