/** @jest-environment jsdom */

import Ryunix from '../main.js'
import { getState } from '../utils/index.js'
import { workLoop } from '../lib/reconciler/workers.js'
import { Header, Footer, Main } from '../lib/ui/layout.js'

const flush = async () => {
  workLoop({ timeRemaining: () => 100 })
  await new Promise((resolve) => setTimeout(resolve, 20))
  workLoop({ timeRemaining: () => 100 })
}

describe('layout shell', () => {
  let container

  beforeEach(() => {
    document.querySelectorAll('#__ryunix').forEach((node) => node.remove())
    const state = getState()
    state.currentRoot = null
    state.wipRoot = null
    state.containerRoot = null
    container = document.createElement('div')
    container.id = '__ryunix'
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.querySelectorAll('#__ryunix').forEach((node) => node.remove())
  })

  it('renders brand left and children right in Header', async () => {
    container = Ryunix.init(
      Ryunix.createElement(
        Header,
        { image: '/logo.svg', title: 'WEB' },
        Ryunix.createElement(
          'nav',
          null,
          Ryunix.createElement('a', { href: '/docs' }, 'Docs'),
        ),
      ),
    )
    await flush()

    expect(
      container.dom.querySelector('.ryx-header-start .ryx-header-brand-title')
        ?.textContent,
    ).toBe('WEB')
    expect(
      container.dom
        .querySelector('.ryx-header-start .ryx-header-brand-image')
        ?.getAttribute('src'),
    ).toBe('/logo.svg')
    expect(
      container.dom.querySelector('.ryx-header-end nav a')?.textContent,
    ).toBe('Docs')
  })

  it('renders Header with title only when image is omitted', async () => {
    container = Ryunix.init(
      Ryunix.createElement(Header, { title: 'Solo título' }),
    )
    await flush()

    expect(
      container.dom.querySelector('.ryx-header-brand-title')?.textContent,
    ).toBe('Solo título')
    expect(container.dom.querySelector('.ryx-header-brand-image')).toBeNull()
  })

  it('renders Footer grid columns and split bottom bar', async () => {
    container = Ryunix.init(
      Ryunix.createElement(
        Footer,
        {
          title: 'WEB',
          description: 'App de prueba.',
          bottomStart: Ryunix.createElement('span', null, 'Tema'),
          bottomEnd: Ryunix.createElement('p', null, '© 2026'),
        },
        Ryunix.createElement(
          'div',
          null,
          Ryunix.createElement('a', { href: '/docs' }, 'Docs'),
        ),
        Ryunix.createElement(
          'div',
          null,
          Ryunix.createElement('a', { href: 'https://github.com' }, 'GitHub'),
        ),
      ),
    )
    await flush()

    expect(container.dom.querySelectorAll('.ryx-footer-column')).toHaveLength(2)
    expect(
      container.dom.querySelector('.ryx-footer-column a')?.textContent,
    ).toBe('Docs')
    expect(
      container.dom.querySelector('.ryx-footer-bottom-start span')?.textContent,
    ).toBe('Tema')
    expect(
      container.dom.querySelector('.ryx-footer-bottom-end p')?.textContent,
    ).toBe('© 2026')
  })

  it('renders Main with centered inner container', async () => {
    container = Ryunix.init(
      Ryunix.createElement(
        Main,
        { maxWidth: '48rem' },
        Ryunix.createElement('p', null, 'Contenido'),
      ),
    )
    await flush()

    expect(container.dom.querySelector('main.ryx-main')).toBeTruthy()
    expect(container.dom.querySelector('.ryx-main-inner p')?.textContent).toBe(
      'Contenido',
    )
    expect(container.dom.querySelector('.ryx-main-inner')?.style.maxWidth).toBe(
      '48rem',
    )
  })
})
