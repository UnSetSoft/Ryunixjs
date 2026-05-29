import type { MessagesByLocale } from './messages.js'

export interface RyunixI18nCookieConfig {
  name?: string
  maxAgeSeconds?: number
}

export interface RyunixI18nConfig {
  locales: string[]
  defaultLocale: string
  localeLabels?: Record<string, string>
  cookie?: boolean | RyunixI18nCookieConfig
}

export interface CreateI18nOptions extends RyunixI18nConfig {
  messages?: MessagesByLocale
  cookieName?: string
  maxAgeSeconds?: number
}

export interface NormalizedI18nConfig {
  locales: readonly string[]
  defaultLocale: string
  localeLabels: Record<string, string>
  cookieName: string
  maxAgeSeconds: number
  messages: MessagesByLocale
}

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string

export interface I18nContextValue {
  locale: string
  defaultLocale: string
  locales: readonly string[]
  localeLabels: Record<string, string>
  t: TranslateFn
}
