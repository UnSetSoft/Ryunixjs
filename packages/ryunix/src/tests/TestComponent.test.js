import Ryunix from '../lib/index'
import { workLoop } from '../lib/workers'
import { useStore, useEffect } from '../lib/hooks'

describe('App Component with Count and Test', () => {
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

  const Count = ({ value, callback, label }) => {
    return Ryunix.createElement(
      Ryunix.Fragment,
      null,
      Ryunix.createElement('button', { onClick: callback }, `Boton ${label}`),
      Ryunix.createElement('p', null, `Muestra en home el valor: ${value}`),
    )
  }

  const Test = () => {
    const [message, setCount] = useStore('')
    const click = () => setCount((p) => 'hello')
    return Ryunix.createElement(Count, {
      value: message,
      callback: click,
      label: 'Test',
    })
  }

  const App = () => {
    const [count, setCount] = useStore('')
    const click = () => setCount('hola')

    return Ryunix.createElement(Ryunix.Fragment, null, [
      Ryunix.createElement('button', { onClick: click }, `Click me`),
      Ryunix.createElement('p', null, `Muestra en home el valor: ${count}`),
    ])
  }

  test('renders App and updates state from Test and App buttons', () => {
    const root = Ryunix.createElement(App)
    container = Ryunix.render(root, container)

    workLoop({ timeRemaining: () => 100 })

    const button = container.dom.querySelector('button')

    workLoop({ timeRemaining: () => 100 })

    // Simula click en el segundo botón (App)
    button.click()

    const paragraph = container.dom.querySelector('p')
    expect(paragraph.textContent).toBe('Muestra en home el valor: hola')
  })
})
