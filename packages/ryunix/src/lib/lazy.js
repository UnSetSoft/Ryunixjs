import { createElement } from './createElement'
import { useStore, useEffect } from './hooks'

/**
 * Lazy load component
 */
const lazy = (importFn) => {
  let Component = null
  let promise = null
  let error = null

  return (props) => {
    const [, forceUpdate] = useStore(0)

    useEffect(() => {
      if (Component || error) return

      if (!promise) {
        promise = importFn()
          .then((module) => {
            Component = module.default || module
            forceUpdate((x) => x + 1)
          })
          .catch((err) => {
            error = err
            forceUpdate((x) => x + 1)
          })
      }
    }, [])

    if (error) throw error
    if (!Component) return null
    return createElement(Component, props)
  }
}

/**
 * Suspense component (basic implementation)
 */
const Suspense = ({ fallback, children }) => {
  const [isLoading, setIsLoading] = useStore(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading && fallback) {
    return fallback
  }

  return children
}

/**
 * Preload component for prefetching
 */
const preload = (importFn) => {
  return importFn()
}

export { lazy, Suspense, preload }