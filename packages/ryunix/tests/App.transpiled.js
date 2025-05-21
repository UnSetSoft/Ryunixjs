'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.default = void 0
var _ryunixjs = require('@unsetsoft/ryunixjs')
console.log('[App.ryx] File loaded')
const Count = ({ value, callback, label }) => {
  ;(0, _ryunixjs.useEffect)(() => {
    console.log(`----------[called from ${label}]----------`)
    console.log(`${label}:`, value)
    console.log(`------------------------------------------`)
  }, [value])
  return /*#__PURE__*/ React.createElement(
    React.Fragment,
    null,
    /*#__PURE__*/ React.createElement(
      'button',
      {
        onClick: callback,
      },
      'Boton ',
      label,
    ),
    /*#__PURE__*/ React.createElement(
      'p',
      null,
      'Muestra en home el valor: ',
      value,
    ),
  )
}
const Test = () => {
  const [message, setCount] = (0, _ryunixjs.useStore)('')
  const click = () => setCount((p) => 'hello')
  return /*#__PURE__*/ React.createElement(Count, {
    value: message,
    callback: click,
    label: 'Test',
  })
}
const App = () => {
  const [count, setCount] = (0, _ryunixjs.useStore)('')
  const click = () => setCount('hola')
  return /*#__PURE__*/ React.createElement(
    'div',
    null,
    /*#__PURE__*/ React.createElement(
      'main',
      null,
      /*#__PURE__*/ React.createElement(
        'div',
        {
          'ryunix-class': 'container',
        },
        /*#__PURE__*/ React.createElement(Children, null),
        /*#__PURE__*/ React.createElement(Count, {
          value: count,
          callback: click,
          label: 'App',
        }),
        /*#__PURE__*/ React.createElement(Test, null),
      ),
    ),
  )
}
var _default = (exports.default = App)
