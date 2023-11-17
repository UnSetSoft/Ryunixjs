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

const Navigate = (props) => {
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
    if (window.location.pathname !== props.to) {
      window.history.pushState({}, '', props.to)
      const navigationEvent = new Event('pushsatate')
      window.dispatchEvent(navigationEvent)
    }
  }

  const anchor = {
    href: props.to,
    onClick: preventReload,
    ...props,
  }

  const children = props.label ? props.label : props.children

  return createElement('a', anchor, children)
}

export { Router, Navigate }
