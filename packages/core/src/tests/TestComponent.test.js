import * as Ryunix from '../lib/index.js'
import { workLoop } from '../lib/workers.js'
import { useStore } from '../lib/hooks.js'

describe('useStore Hook', () => {
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

  test('updates state correctly and reflects in DOM', () => {
    // Define a function component that uses hooks properly
    const TestComponent = () => {
      const [message, setMessage] = useStore('')

      const button = Ryunix.createElement(
        'button',
        {
          onClick: () => setMessage('hola'),
        },
        'Click me',
      )

      const paragraph = Ryunix.createElement(
        'p',
        null,
        `Muestra en home el valor: ${message}`,
      )

      return Ryunix.createElement('div', null, button, paragraph)
    }

    const Root = Ryunix.createElement(TestComponent, null)

    container = Ryunix.init(Root)

    // Verify the container has the `dom` property configured
    expect(container.dom).toBeDefined()

    workLoop({ timeRemaining: () => 100 })

    const buttonElement = container.dom.querySelector('button')
    buttonElement.click()

    workLoop({ timeRemaining: () => 100 })

    const paragraphElement = container.dom.querySelector('p')
    expect(paragraphElement.textContent).toBe('Muestra en home el valor: hola')
  })
})
