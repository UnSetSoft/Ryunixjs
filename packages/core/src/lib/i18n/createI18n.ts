import { createElement } from '../reconciler/createElement.js'
import { createContext, useRouter } from '../hooks/hooks.js'
import type { RyunixNode } from '../../types/internal.js'
import { getRyunixI18nConfig } from './config.js'
import {
  defineMessages,
  formatMessage,
  resolveMessageKey,
  type MessagesByLocale,
} from './messages.js'
import {
  getLocaleFromPath,
  localePath,
  normalizeI18nConfig,
  pickLocale,
  swapLocalePath,
} from './paths.js'
import type {
  CreateI18nOptions,
  I18nContextValue,
  NormalizedI18nConfig,
  RyunixI18nConfig,
  TranslateFn,
} from './types.js'

export const DEFAULT_LOCALE_COOKIE_NAME = 'ryunix_locale'

function resolveCookieOptions(
  cookie: CreateI18nOptions['cookie'],
  cookieName?: string,
  maxAgeSeconds?: number,
) {
  const enabled = cookie !== false
  const cookieConfig = typeof cookie === 'object' ? cookie : {}
  return {
    enabled,
    cookieName: cookieName ?? cookieConfig.name ?? DEFAULT_LOCALE_COOKIE_NAME,
    maxAgeSeconds:
      maxAgeSeconds ?? cookieConfig.maxAgeSeconds ?? 365 * 24 * 60 * 60,
  }
}

function normalizeOptions(options: CreateI18nOptions): NormalizedI18nConfig & {
  cookieEnabled: boolean
} {
  const base = normalizeI18nConfig({
    locales: options.locales,
    defaultLocale: options.defaultLocale,
  })
  const cookie = resolveCookieOptions(
    options.cookie,
    options.cookieName,
    options.maxAgeSeconds,
  )
  const localeLabels: Record<string, string> = { ...options.localeLabels }
  for (const locale of base.locales) {
    if (!localeLabels[locale]) localeLabels[locale] = locale.toUpperCase()
  }
  return {
    locales: base.locales,
    defaultLocale: base.defaultLocale,
    localeLabels,
    cookieName: cookie.cookieName,
    maxAgeSeconds: cookie.maxAgeSeconds,
    cookieEnabled: cookie.enabled,
    messages: options.messages ?? {},
  }
}

function createTranslate(
  messages: MessagesByLocale,
  locale: string,
  defaultLocale: string,
): TranslateFn {
  return (key, params) => {
    const value =
      resolveMessageKey(messages[locale], key) ??
      resolveMessageKey(messages[defaultLocale], key) ??
      key
    return formatMessage(value, params)
  }
}

export function createI18n(options: CreateI18nOptions) {
  const config = normalizeOptions(options)
  const { Provider: I18nContextProvider, useContext } =
    createContext<I18nContextValue>('ryunix.i18n', {
      locale: config.defaultLocale,
      defaultLocale: config.defaultLocale,
      locales: config.locales,
      localeLabels: config.localeLabels,
      t: (key) => key,
    })

  const isLocale = (value: unknown): value is string =>
    typeof value === 'string' && config.locales.includes(value)

  const getLocaleCookie = (): string | null => {
    if (!config.cookieEnabled || typeof document === 'undefined') return null
    const pattern = new RegExp(
      `(?:^|;\\s*)${config.cookieName}=(${config.locales.map(escapeRegExp).join('|')})(?:;|$)`,
    )
    const match = document.cookie.match(pattern)
    return match ? match[1] : null
  }

  const setLocaleCookie = (locale: string) => {
    if (
      !config.cookieEnabled ||
      typeof document === 'undefined' ||
      !isLocale(locale)
    )
      return
    document.cookie = `${config.cookieName}=${locale}; path=/; max-age=${config.maxAgeSeconds}; SameSite=Lax`
  }

  const resolveLocaleFromCookie = () =>
    getLocaleCookie() || config.defaultLocale

  const getLocaleRedirectScript = () => {
    if (!config.cookieEnabled) return ''
    const localesPattern = config.locales.map(escapeRegExp).join('|')
    return `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)${config.cookieName}=(${localesPattern})(?:;|$)/);var l=m?m[1]:'${config.defaultLocale}';var p=location.pathname;var r=new RegExp('^/(${localesPattern})(/|$)');if(!r.test(p)){location.replace('/'+l+(p==='/'?'':p));}}catch(e){}})();`
  }

  const Provider = ({
    locale,
    children,
  }: {
    locale?: string
    children?: RyunixNode
  }) => {
    const resolved = isLocale(locale) ? locale : config.defaultLocale
    const value: I18nContextValue = {
      locale: resolved,
      defaultLocale: config.defaultLocale,
      locales: config.locales,
      localeLabels: config.localeLabels,
      t: createTranslate(config.messages, resolved, config.defaultLocale),
    }
    return createElement(I18nContextProvider, { value, children })
  }

  const useI18n = (): I18nContextValue => useContext() as I18nContextValue

  const useLocale = (): string => useI18n().locale

  const useTranslations = (): TranslateFn => useI18n().t

  const generateStaticParams = () =>
    config.locales.map((locale) => ({ locale }))

  const LocaleSwitcher = ({ className = '' }: { className?: string }) => {
    const { location, navigate } = useRouter()
    const { locale: current, localeLabels, locales } = useI18n()

    const onSelect = (locale: string) => {
      if (locale === current) return
      setLocaleCookie(locale)
      const next = swapLocalePath(location, locale, {
        locales,
        defaultLocale: config.defaultLocale,
      })
      navigate(next.startsWith(`/${locale}`) ? next : `/${locale}`)
    }

    return createElement('div', {
      className: `ryunix-locale-switcher ${className}`.trim(),
      role: 'group',
      'aria-label': 'Language',
      children: locales.map((locale) =>
        createElement(
          'button',
          {
            key: locale,
            type: 'button',
            onClick: () => onSelect(locale),
            className:
              locale === current
                ? 'ryunix-locale-switcher__btn is-active'
                : 'ryunix-locale-switcher__btn',
            'aria-current': locale === current ? 'true' : undefined,
          },
          localeLabels[locale] ?? locale,
        ),
      ),
    })
  }

  return {
    config,
    Provider,
    useI18n,
    useLocale,
    useTranslations,
    LocaleSwitcher,
    generateStaticParams,
    getLocaleFromPath: (pathname: string) =>
      getLocaleFromPath(pathname, config.locales),
    localePath: (locale: string, path = '') =>
      localePath(locale, path, config.locales),
    swapLocalePath: (pathname: string, targetLocale: string) =>
      swapLocalePath(pathname, targetLocale, {
        locales: config.locales,
        defaultLocale: config.defaultLocale,
      }),
    pickLocale: <T>(record: Record<string, T>, locale: string) =>
      pickLocale(record, locale, config.defaultLocale),
    getLocaleCookie,
    setLocaleCookie,
    resolveLocaleFromCookie,
    getLocaleRedirectScript,
  }
}

/** Merge `ryunix.config.js` i18n with optional message dictionaries. */
export function createAppI18n(
  messages?: MessagesByLocale,
  fallback?: RyunixI18nConfig,
) {
  const fromConfig = getRyunixI18nConfig() ?? fallback
  if (!fromConfig) {
    throw new Error(
      '[Ryunix i18n] Missing ryunix.config.i18n. Add i18n: { locales, defaultLocale } to ryunix.config.js, pass a fallback to createAppI18n(), or call createI18n() directly.',
    )
  }
  return createI18n({ ...fromConfig, messages })
}

export function createI18nFromConfig(
  config: RyunixI18nConfig | null | undefined,
  messages?: MessagesByLocale,
) {
  if (!config?.locales?.length) {
    throw new Error(
      '[Ryunix i18n] Invalid i18n config: locales array is required.',
    )
  }
  return createI18n({ ...config, messages })
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export { defineMessages, getRyunixI18nConfig }
export {
  getLocaleFromPath,
  localePath,
  pickLocale,
  swapLocalePath,
  normalizeI18nConfig,
} from './paths.js'
