import Ryunix from '../lib/index'
import { workLoop } from '../lib/workers'
import { useStore } from '../lib/hooks'

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
  const [message, setMessage] = useStore('')

  test('updates state correctly and reflects in DOM', () => {
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

    const Root = Ryunix.createElement('div', null, [button, paragraph])

    container = Ryunix.init(Root())

    // Verificar que el contenedor tiene la propiedad `dom` configurada
    expect(container.dom).toBeDefined()

    workLoop({ timeRemaining: () => 100 })

    const buttonElement = container.dom.querySelector('button')
    buttonElement.click()

    workLoop({ timeRemaining: () => 100 })

    const paragraphElement = container.dom.querySelector('p')
    expect(paragraphElement.textContent).toBe('Muestra en home el valor: hola')
  })
})
