import { createElement } from '../reconciler/createElement.js'
import { useEffect, useStore } from '../hooks/hooks.js'
import {
  themeController,
  type ThemeController,
  type ThemePreference,
  type ThemeToggleLabels,
} from './theme.js'

export interface ThemeToggleProps {
  labels: ThemeToggleLabels
  className?: string
  controller?: ThemeController
}

const SunIcon = ({ className = '' }: { className?: string }) =>
  createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.75,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className,
      'aria-hidden': true,
    },
    createElement('circle', { cx: 12, cy: 12, r: 4 }),
    createElement('path', {
      d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41',
    }),
  )

const MonitorIcon = ({ className = '' }: { className?: string }) =>
  createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.75,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className,
      'aria-hidden': true,
    },
    createElement('rect', { x: 2, y: 3, width: 20, height: 14, rx: 2 }),
    createElement('path', { d: 'M8 21h8M12 17v4' }),
  )

const MoonIcon = ({ className = '' }: { className?: string }) =>
  createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.75,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className,
      'aria-hidden': true,
    },
    createElement('path', {
      d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
    }),
  )

const ICONS = {
  light: SunIcon,
  system: MonitorIcon,
  dark: MoonIcon,
} as const

export function ThemeToggle({
  labels,
  className = '',
  controller = themeController,
}: ThemeToggleProps) {
  const [theme, setTheme] = useStore(controller.defaultTheme)

  useEffect(() => {
    const saved = controller.resolveThemeFromCookie()
    setTheme(saved)
    controller.applyTheme(saved)
  }, [])

  useEffect(() => {
    if (theme !== 'system') return undefined
    return controller.watchSystemTheme(() => controller.applyTheme('system'))
  }, [theme])

  const selectTheme = (next: ThemePreference) => {
    if (next === theme) return
    setTheme(next)
    controller.setThemeCookie(next)
    controller.applyTheme(next)
  }

  return createElement(
    'div',
    {
      className: `ryx-theme-segment ${className}`.trim(),
      role: 'radiogroup',
      'aria-label': labels.title,
    },
    ...controller.themes.map((id) => {
      const active = theme === id
      const Icon = ICONS[id]
      return createElement(
        'button',
        {
          key: id,
          type: 'button',
          role: 'radio',
          'aria-checked': active ? 'true' : 'false',
          title: labels[id],
          className: `ryx-theme-segment-btn${active ? ' ryx-theme-segment-btn--active' : ''}`,
          onClick: () => selectTheme(id),
        },
        Icon({ className: 'ryx-theme-segment-icon' }),
        createElement(
          'span',
          { className: 'ryx-theme-segment-sr-only' },
          labels[id],
        ),
      )
    }),
  )
}

export interface ThemeInitScriptProps {
  controller?: ThemeController
}

export function ThemeInitScript({
  controller = themeController,
}: ThemeInitScriptProps = {}) {
  return createElement('script', {
    dangerouslySetInnerHTML: { __html: controller.getInitScript() },
  })
}

export type { ThemeToggleLabels } from './theme.js'
