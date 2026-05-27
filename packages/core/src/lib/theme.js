export const DEFAULT_THEME_COOKIE_NAME = 'ryunix_theme'
export const THEME_PREFERENCES = ['light', 'system', 'dark']
export function createThemeController(options = {}) {
  const cookieName = options.cookieName ?? DEFAULT_THEME_COOKIE_NAME
  const defaultTheme = options.defaultTheme ?? 'dark'
  const darkClass = options.darkClass ?? 'dark'
  const maxAgeSeconds = options.maxAgeSeconds ?? 365 * 24 * 60 * 60
  const isThemePreference = (theme) => THEME_PREFERENCES.includes(theme)
  const getThemeCookie = () => {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${cookieName}=(light|system|dark)(?:;|$)`),
    )
    return match ? match[1] : null
  }
  const setThemeCookie = (theme) => {
    if (typeof document === 'undefined' || !isThemePreference(theme)) return
    document.cookie = `${cookieName}=${theme}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`
  }
  const resolveThemeFromCookie = () => getThemeCookie() || defaultTheme
  const getSystemColorScheme = () => {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  const resolveEffectiveTheme = (theme) => {
    const choice = isThemePreference(theme) ? theme : defaultTheme
    if (choice === 'system') return getSystemColorScheme()
    return choice
  }
  const applyTheme = (theme) => {
    if (typeof document === 'undefined') return
    const preference = isThemePreference(theme) ? theme : defaultTheme
    const effective = resolveEffectiveTheme(preference)
    const root = document.documentElement
    root.classList.toggle(darkClass, effective === 'dark')
    root.dataset.theme = preference
    root.dataset.themeEffective = effective
    root.style.colorScheme = effective === 'dark' ? 'dark' : 'light'
  }
  const getInitScript = () =>
    `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)${cookieName}=(light|system|dark)(?:;|$)/);var t=m?m[1]:'${defaultTheme}';var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('${darkClass}',dark);r.dataset.theme=t;r.dataset.themeEffective=dark?'dark':'light';r.style.colorScheme=dark?'dark':'light';}catch(e){document.documentElement.classList.add('${darkClass}');}})();`
  const watchSystemTheme = (onChange) => {
    if (typeof window === 'undefined') return () => {}
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => onChange(getSystemColorScheme())
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }
  return {
    cookieName,
    defaultTheme,
    themes: THEME_PREFERENCES,
    getThemeCookie,
    setThemeCookie,
    resolveThemeFromCookie,
    getSystemColorScheme,
    resolveEffectiveTheme,
    applyTheme,
    getInitScript,
    watchSystemTheme,
  }
}
export const themeController = createThemeController()
export const {
  cookieName: THEME_COOKIE_NAME,
  defaultTheme,
  themes,
  getThemeCookie,
  setThemeCookie,
  resolveThemeFromCookie,
  getSystemColorScheme,
  resolveEffectiveTheme,
  applyTheme,
  watchSystemTheme,
} = themeController
export const themeInitScript = themeController.getInitScript()
