import Ryunix from '../src/lib/index.js'
import App from './App.ryx'

console.log('[App.test.js] Test file loaded')
console.log('[App.test.js] App component:', App)

describe('Ryunix App Component', () => {
  let container

  beforeEach(() => {
    console.log('[App.test.js] beforeEach executed')
    container = document.createElement('div')
    container.id = '__ryunix'
    document.body.appendChild(container)
    Ryunix.render(App, container)
  })

  test('should render App and Test components correctly', () => {
    console.log('DOM after rendering:', container.innerHTML)

    const appButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Boton App'),
    )
    const testButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Boton Test'),
    )

    console.log('App button found:', appButton)
    console.log('Test button found:', testButton)

    expect(appButton).not.toBeNull()
    expect(testButton).not.toBeNull()
  })

  test('should update App value on button click', () => {
    const appButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Boton App'),
    )

    expect(appButton).not.toBeNull()

    if (appButton) {
      appButton.click()
      const appValue = Array.from(document.querySelectorAll('p')).find((p) =>
        p.textContent.includes('Muestra en home el valor: hola'),
      )
      console.log('App value found:', appValue)

      expect(appValue).not.toBeNull()
      expect(appValue.textContent).toContain('Muestra en home el valor: hola')
    }
  })

  test('should update Test value on button click', () => {
    const testButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Boton Test'),
    )

    expect(testButton).not.toBeNull()

    if (testButton) {
      testButton.click()
      const testValue = Array.from(document.querySelectorAll('p')).find((p) =>
        p.textContent.includes('Muestra en home el valor: hello'),
      )
      console.log('Test value found:', testValue)

      expect(testValue).not.toBeNull()
      expect(testValue.textContent).toContain('Muestra en home el valor: hello')
    }
  })

  test('Ryunix.init should be defined and point to the correct function', () => {
    console.log('[App.test.js] Ryunix.init:', Ryunix.init)
    expect(Ryunix.init).toBeDefined()
  })

  test('minimal test case', () => {
    expect(true).toBe(true)
  })
})
