import { vars } from '../utils/index'
import { isEqual } from 'lodash'

/**
 * useStore is similar to useState in React, managing local state within a functional component.
 */
const useStore = (initial) => {
  const oldHook = vars.workInProgressFiber.alternate?.hooks?.[vars.hookIndex]
  const hook = { state: oldHook ? oldHook.state : initial, queue: [] }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = typeof action === 'function' ? action(hook.state) : action
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

  vars.workInProgressFiber.hooks.push(hook)
  vars.hookIndex++
  return [hook.state, setState]
}

/**
 * useEffect runs side effects after rendering based on dependencies.
 */
const useEffect = (callback, deps) => {
  const oldHook = vars.workInProgressFiber.alternate?.hooks?.[vars.hookIndex]
  const hook = { type: 'effect', deps }

  const hasChanged = !oldHook || !isEqual(oldHook.deps, deps)
  if (hasChanged) {
    const cleanup = callback()
    hook.cleanup = cleanup
  }

  vars.workInProgressFiber.hooks.push(hook)
  vars.hookIndex++
}

/**
 * useRef creates a mutable ref object to store values across renders.
 */
const useRef = (initialValue) => {
  const oldHook = vars.workInProgressFiber.alternate?.hooks?.[vars.hookIndex]
  const hook = { value: oldHook ? oldHook.value : { current: initialValue } }

  vars.workInProgressFiber.hooks.push(hook)
  vars.hookIndex++
  return hook.value
}

/**
 * useMemo memoizes a value to avoid recomputations.
 */
const useMemo = (computeFn, deps) => {
  const oldHook = vars.workInProgressFiber.alternate?.hooks?.[vars.hookIndex]
  const hook = { deps, value: oldHook && isEqual(deps, oldHook.deps) ? oldHook.value : computeFn() }

  vars.workInProgressFiber.hooks.push(hook)
  vars.hookIndex++
  return hook.value
}

/**
 * useCallback memoizes a callback function to avoid unnecessary recreations.
 */
const useCallback = (callback, deps) => useMemo(() => callback, deps)

export { useStore, useEffect, useRef, useMemo, useCallback }
