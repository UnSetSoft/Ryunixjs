import Ryunix from '../main.js'
import { ServerBoundary } from '../lib/hydration/boundaries.js'
import { findNearestHydrationBoundary } from '../lib/hydration/policy.js'
import { workLoop } from '../lib/reconciler/workers.js'

describe('ServerBoundary hydration', () => {
  let mount

  beforeEach(() => {
    mount = document.createElement('div')
    mount.id = '__ryunix'
    document.body.appendChild(mount)
  })

  afterEach(() => {
    if (mount && document.body.contains(mount)) {
      document.body.removeChild(mount)
    }
  })

  test('findNearestHydrationBoundary ignores ServerBoundary', () => {
    const serverType = () => null
    serverType.ryunix_type = 'RYUNIX_SERVER_BOUNDARY'
    const serverFiber = { type: serverType, parent: null }
    const nested = { type: 'p', parent: serverFiber }

    expect(findNearestHydrationBoundary(nested)).toBeNull()
  })

  test('preserves SSR markup inside data-ryunix-server', () => {
    mount.setAttribute('data-ryunix-ssr-root', '')
    mount.innerHTML =
      '<div data-ryunix-server="page"><p id="ssr-only">from server</p></div>'

    const App = () =>
      Ryunix.createElement(
        ServerBoundary,
        { id: 'page' },
        Ryunix.createElement('p', { id: 'client' }, 'from client'),
      )

    Ryunix.init(Ryunix.createElement(App, null))
    workLoop({ timeRemaining: () => 100 })

    expect(mount.querySelector('#ssr-only')?.textContent).toBe('from server')
    expect(mount.querySelector('#client')).toBeNull()
    expect(mount.querySelector('[data-ryunix-server="page"]')).not.toBeNull()
  })
})
