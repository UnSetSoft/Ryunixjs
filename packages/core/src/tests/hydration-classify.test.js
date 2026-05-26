import Ryunix from '../main.js'
import { workLoop } from '../lib/workers.js'
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
    mount.innerHTML = '<p>server text</p>'

    const App = () => Ryunix.createElement('p', null, 'client text')

    Ryunix.init(Ryunix.createElement(App, null))
    workLoop({ timeRemaining: () => 100 })

    expect(mount.querySelector('p')?.textContent).toBe('client text')
    expect(Boolean(getState().hydrationRecover)).toBe(false)
  })
})
