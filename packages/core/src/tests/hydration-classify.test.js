import Ryunix from '../main.js'
import { workLoop } from '../lib/reconciler/workers.js'
import { getState } from '../utils/index.js'

describe('hydration classification', () => {
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

  test('patches recoverable text mismatch without root fallback', () => {
    mount.setAttribute('data-ryunix-ssr-root', '')
    mount.innerHTML = '<p>server text</p>'

    const App = () => Ryunix.createElement('p', null, 'client text')

    Ryunix.init(Ryunix.createElement(App, null))
    workLoop({ timeRemaining: () => 100 })

    expect(mount.querySelector('p')?.textContent).toBe('client text')
    expect(Boolean(getState().hydrationRecover)).toBe(false)
  })

  test('re-init replaces stale client tree instead of duplicating it', () => {
    mount.innerHTML = '<p>stale client tree</p>'

    const First = () => Ryunix.createElement('p', null, 'first')
    const Second = () => Ryunix.createElement('p', null, 'second')

    Ryunix.init(Ryunix.createElement(First, null))
    workLoop({ timeRemaining: () => 100 })
    expect(mount.querySelectorAll('p')).toHaveLength(1)

    Ryunix.init(Ryunix.createElement(Second, null))
    workLoop({ timeRemaining: () => 100 })

    expect(mount.querySelectorAll('p')).toHaveLength(1)
    expect(mount.querySelector('p')?.textContent).toBe('second')
  })
})
