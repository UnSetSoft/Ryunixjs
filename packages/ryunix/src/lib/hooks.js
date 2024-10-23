import { RYUNIX_TYPES, STRINGS, vars } from '../utils/index'
import { isEqual } from 'lodash'
import { Fragment, createElement, cloneElement } from './createElement'

/**
 * @description The `useStore` function creates a state hook.
 * @param initial - The initial state value for the hook.
 * @returns [state, setState] - The current state and a function to update the state.
 */
const useStore = (initial) => {
  const oldHook = vars.wipFiber.alternate?.hooks?.[vars.hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    hook.state = typeof action === STRINGS.function ? action(hook.state) : action
  })

  const setState = (action) => {
    hook.queue.push(action)
    vars.wipRoot = {
      dom: vars.currentRoot.dom,
      props: vars.currentRoot.props,
      alternate: vars.currentRoot,
    }
    vars.nextUnitOfWork = vars.wipRoot
    vars.deletions = []
  }

  vars.wipFiber.hooks.push(hook)
  vars.hookIndex++
  
  return [hook.state, setState]
}

/**
 * The `useEffect` function creates a hook for managing side effects in Ryunix components.
 * @param callback - The function to be executed after rendering or when dependencies change.
 * @param deps - Dependencies for the effect. If any of the dependencies change, the effect will be re-run.
 */
const useEffect = (callback, deps) => {
  const oldHook = vars.wipFiber.alternate?.hooks?.[vars.hookIndex]
  const hook = { type: RYUNIX_TYPES.RYUNIX_EFFECT, deps }

  if (!oldHook || !isEqual(oldHook.deps, hook.deps)) {
    callback()
  }

  vars.wipFiber.hooks.push(hook)
  vars.hookIndex++
}

/**
 * The `useQuery` function retrieves URL query parameters.
 * @returns An object with the current query parameters.
 */
const useQuery = () => {
  const oldHook = vars.wipFiber.alternate?.hooks?.[vars.hookIndex]
  const urlSearchParams = new URLSearchParams(window.location.search)
  const params = Object.fromEntries(urlSearchParams.entries())

  const hook = {
    type: RYUNIX_TYPES.RYUNIX_URL_QUERY,
    query: oldHook ? oldHook.query : params,
  }

  vars.wipFiber.hooks.push(hook)
  vars.hookIndex++
  
  return hook.query
}

/**
 * The `useRef` function creates a ref object to store a mutable value.
 * @param initial - The initial value for the ref.
 * @returns A ref object with a `current` property.
 */
const useRef = (initial) => {
  const oldHook = vars.wipFiber.alternate?.hooks?.[vars.hookIndex]
  const hook = {
    type: RYUNIX_TYPES.RYUNIX_REF,
    value: oldHook ? oldHook.value : { current: initial },
  }

  vars.wipFiber.hooks.push(hook)
  vars.hookIndex++
  
  return hook.value
}

/**
 * The `useMemo` function returns a memoized value based on dependencies.
 * @param comp - The function to compute the memoized value.
 * @param deps - Dependencies for the memoization.
 * @returns The memoized value.
 */
const useMemo = (comp, deps) => {
  const oldHook = vars.wipFiber.alternate?.hooks?.[vars.hookIndex]
  const hook = { type: RYUNIX_TYPES.RYUNIX_MEMO, value: null, deps }

  if (oldHook && isEqual(oldHook.deps, hook.deps)) {
    hook.value = oldHook.value
  } else {
    hook.value = comp()
  }

  vars.wipFiber.hooks.push(hook)
  vars.hookIndex++
  
  return hook.value
}

/**
 * The `useCallback` function returns a memoized callback function.
 * @param callback - The function to be memoized.
 * @param deps - Dependencies for the memoization.
 * @returns The memoized callback.
 */
const useCallback = (callback, deps) => useMemo(() => callback, deps)

/**
 * The `useRouter` function creates a router hook for managing route navigation.
 * @param routes - An array of route objects.
 * @returns An object with a `Children` component and a `navigate` function.
 */
const useRouter = (routes) => {
  const [location, setLocation] = useStore(window.location.pathname)

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setLocation(path)
  }

  useEffect(() => {
    const onPopState = () => setLocation(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const currentRoute = routes.find((route) => route.path === location)
  const Children = () => currentRoute ? currentRoute.component : null

  return { Children, navigate }
}

export {
  useStore,
  useEffect,
  useQuery,
  useRef,
  useMemo,
  useCallback,
  useRouter,
}
