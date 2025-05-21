import Ryunix from '../lib/index'
import { workLoop } from '../lib/workers'

describe('Ryunix App', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    container.id = '__ryunix'
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container && container.dom && document.body.contains(container.dom)) {
      document.body.removeChild(container.dom)
      container = null
    }
  })

  test('render a simple element', () => {
    const App = Ryunix.createElement('div', { id: 'd' }, 'Hello Ryunix!')
    container = Ryunix.render(App, container)

    // espera para que el dom se actualice
    workLoop({
      timeRemaining: () => 100, // Simula tiempo de CPU disponible
    })

    const renderedElement = container.dom.querySelector('#d')
    expect(renderedElement).not.toBeNull()
    expect(renderedElement.textContent).toBe('Hello Ryunix!')
  })
})
