import Ryunix from '../main.js'
import { workLoop } from '../lib/reconciler/workers.js'
import { useStore } from '../lib/hooks/index.js'

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

  test('updates state correctly and reflects in DOM', async () => {
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

    expect(container.dom).toBeDefined()

    workLoop({ timeRemaining: () => 100 })

    const buttonElement = container.dom.querySelector('button')
    buttonElement.click()

    await new Promise((resolve) => setTimeout(resolve, 20))
    workLoop({ timeRemaining: () => 100 })

    const paragraphElement = container.dom.querySelector('p')
    expect(paragraphElement.textContent).toBe('Muestra en home el valor: hola')
  })
})
