import {
  createThemeController,
  resolveEffectiveTheme,
} from '../lib/ui/theme.js'

describe('theme controller', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-theme-effective')
    document.documentElement.style.colorScheme = ''
    document.cookie = 'ryunix_theme=; Max-Age=0; path=/'
  })

  it('persists preference in cookie', () => {
    const theme = createThemeController({ cookieName: 'test_theme' })
    theme.setThemeCookie('light')
    expect(theme.getThemeCookie()).toBe('light')
  })

  it('applies dark class from preference', () => {
    const theme = createThemeController({ cookieName: 'test_theme' })
    theme.applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('applies light when preference is light', () => {
    const theme = createThemeController({ cookieName: 'test_theme' })
    theme.applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.themeEffective).toBe('light')
  })

  it('resolves system preference from matchMedia', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false })
    expect(resolveEffectiveTheme('system')).toBe('light')
  })
})
