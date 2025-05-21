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
    useEffect(() => {
      console.log(`----------[called from ${label}]----------`)
      console.log(`${label}:`, value === '' ? '[empty]' : value)
      console.log(`------------------------------------------`)
    }, [value])

    return Ryunix.createElement(
      Ryunix.Fragment,
      null,
      Ryunix.createElement('button', { onClick: callback }, `Boton ${label}`),
      Ryunix.createElement('p', null, `Muestra en home el valor: ${value}`),
    )
  }

  const Test = () => {
    const [message, setCount] = useStore('')
    const click = () => setCount('hello')
    return Ryunix.createElement(Count, {
      value: message,
      callback: click,
      label: 'Test',
    })
  }

  const App = () => {
    const [count, setCount] = useStore('')
    const click = () => setCount('hola')

    return Ryunix.createElement(
      'div',
      null,
      Ryunix.createElement(
        'main',
        null,
        Ryunix.createElement(
          'div',
          { 'ryunix-class': 'container' },
          Ryunix.createElement(Test),
          Ryunix.createElement(Count, {
            value: count,
            callback: click,
            label: 'App',
          }),
          Ryunix.createElement(Test),
        ),
      ),
    )
  }

  test('renders App and updates state from Test and App buttons', () => {
    const root = Ryunix.createElement(App)
    container = Ryunix.render(root, container)

    workLoop({ timeRemaining: () => 100 })

    const buttons = container.dom.querySelectorAll('button')
    expect(buttons.length).toBe(3)

    // Click en el botón "App"
    buttons[1].click()
    workLoop({ timeRemaining: () => 100 })

    const paragraphs = container.dom.querySelectorAll('p')
    expect(paragraphs.length).toBe(3)
    expect(paragraphs[1].textContent).toBe('Muestra en home el valor: hola')

    // Click en el botón "Test"
    buttons[0].click()
    workLoop({ timeRemaining: () => 100 })

    expect(paragraphs.length).toBe(3)
    expect(paragraphs[0].textContent).toBe('Muestra en home el valor: hello')
  })
})
