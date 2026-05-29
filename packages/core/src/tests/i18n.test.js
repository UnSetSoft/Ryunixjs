import {
  createI18n,
  defineMessages,
  getLocaleFromPath,
  swapLocalePath,
} from '../lib/i18n/index.js'
import { formatMessage, resolveMessageKey } from '../lib/i18n/messages.js'

const messages = defineMessages({
  en: { home: { title: 'Hello {name}' } },
  es: { home: { title: 'Hola {name}' } },
})

describe('i18n paths', () => {
  it('reads locale prefix from pathname', () => {
    expect(getLocaleFromPath('/es/docs', ['en', 'es'])).toBe('es')
    expect(getLocaleFromPath('/fr', ['en', 'es'])).toBe(null)
  })

  it('swaps locale while keeping path suffix', () => {
    expect(
      swapLocalePath('/en/docs/start', 'es', {
        locales: ['en', 'es'],
        defaultLocale: 'en',
      }),
    ).toBe('/es/docs/start')
  })
})

describe('i18n messages', () => {
  it('resolves nested keys and interpolates params', () => {
    const template = resolveMessageKey(messages.es, 'home.title')
    expect(formatMessage(template, { name: 'Ana' })).toBe('Hola Ana')
  })
})

describe('createI18n', () => {
  beforeEach(() => {
    document.cookie = 'ryunix_locale=; Max-Age=0; path=/'
  })

  it('persists locale in cookie', () => {
    const i18n = createI18n({
      locales: ['en', 'es'],
      defaultLocale: 'en',
      cookieName: 'test_locale',
    })
    i18n.setLocaleCookie('es')
    expect(i18n.getLocaleCookie()).toBe('es')
  })

  it('exposes generateStaticParams for each locale', () => {
    const i18n = createI18n({
      locales: ['en', 'es', 'fr'],
      defaultLocale: 'en',
    })
    expect(i18n.generateStaticParams()).toEqual([
      { locale: 'en' },
      { locale: 'es' },
      { locale: 'fr' },
    ])
  })
})
