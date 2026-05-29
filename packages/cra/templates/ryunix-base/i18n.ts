import { createAppI18n } from '@unsetsoft/ryunixjs'
import messages from './messages/index'

const defaultI18n = {
  locales: ['en', 'es'],
  defaultLocale: 'en',
}

export const i18n = createAppI18n(messages, defaultI18n)

export const {
  Provider: I18nProvider,
  useTranslations,
  useLocale,
  LocaleSwitcher,
  generateStaticParams,
} = i18n
