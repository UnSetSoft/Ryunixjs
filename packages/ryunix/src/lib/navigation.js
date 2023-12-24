import { useStore, useEffect } from './hooks'
import { createElement } from './createElement'
const Router = ({ path, component }) => {
  const [currentPath, setCurrentPath] = useStore(window.location.pathname)

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(() => window.location.pathname)
    }

    window.addEventListener('navigate', onLocationChange)
    window.addEventListener('pushsatate', onLocationChange)
    window.addEventListener('popstate', onLocationChange)

    return () => {
      window.removeEventListener('navigate', onLocationChange)
      window.removeEventListener('pushsatate', onLocationChange)
      window.removeEventListener('popstate', onLocationChange)
    }
  }, [currentPath])

  return currentPath === path ? component() : null
}

const Navigate = () => {
  /**
   * The function `push` is used to push a new state to the browser's history and trigger a custom
   * event called 'pushstate'.
   * @param to - The `to` parameter is a string representing the URL path to which you want to
   * navigate.
   * @param [state] - The `state` parameter is an optional object that represents the state associated
   * with the new history entry. It can be used to store any data that you want to associate with the
   * new URL. When you navigate back or forward in the browser history, this state object will be
   * passed to the `popstate
   * @returns The function `push` does not have a return statement, so it returns `undefined` by
   * default.
   */
  const push = (to, state = {}) => {
    if (window.location.pathname === to) return
    window.history.pushState(state, '', to)
    const navigationEvent = new Event('pushsatate')
    window.dispatchEvent(navigationEvent)
  }

  return { push }
}

const Link = (props) => {
  if (props.style) {
    throw new Error(
      'The style attribute is not supported on internal components, use className.',
    )
  }
  if (props.to === '') {
    throw new Error("'to=' cannot be empty.")
  }
  if (props.className === '') {
    throw new Error('className cannot be empty.')
  }
  if (props.label === '' && !props.children) {
    throw new Error("'label=' cannot be empty.")
  }

  if (!props.to) {
    throw new Error("Missig 'to' param.")
  }
  const preventReload = (event) => {
    event.preventDefault()
    const { push } = Navigate()
    push(props.to)
  }

  const anchor = {
    href: props.to,
    onClick: preventReload,
    ...props,
  }

  const children = props.label ? props.label : props.children

  return createElement('a', anchor, children)
}

export { Router, Navigate, Link }
