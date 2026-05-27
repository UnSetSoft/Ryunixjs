/** @jest-environment jsdom */

import Ryunix from '../main.js'
import { workLoop } from '../lib/reconciler/workers.js'
import { ThemeToggle, createThemeController } from '../lib/index.js'

const flush = async () => {
  workLoop({ timeRemaining: () => 100 })
  await new Promise((resolve) => setTimeout(resolve, 20))
  workLoop({ timeRemaining: () => 100 })
}

describe('ThemeToggle', () => {
  let container

  beforeEach(() => {
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-theme-effective')
    document.documentElement.style.colorScheme = ''
    document.cookie = 'ryunix_theme=; Max-Age=0; path=/'
    container = document.createElement('div')
    container.id = '__ryunix'
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container?.dom && document.body.contains(container.dom)) {
      document.body.removeChild(container.dom)
    }
  })

  it('switches to light theme when clicking the light option', async () => {
    const controller = createThemeController({ cookieName: 'test_theme' })
    const labels = {
      title: 'Theme',
      light: 'Light',
      system: 'System',
      dark: 'Dark',
    }

    container = Ryunix.init(
      Ryunix.createElement(ThemeToggle, { labels, controller }),
    )
    await flush()

    const lightBtn = container.dom.querySelector('button[title="Light"]')
    expect(lightBtn).toBeTruthy()
    lightBtn.click()
    await flush()

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.themeEffective).toBe('light')
    expect(controller.getThemeCookie()).toBe('light')
  })
})
