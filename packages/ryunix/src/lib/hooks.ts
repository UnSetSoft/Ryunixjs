import { hasDepsChanged } from './effects'
import { RYUNIX_TYPES, STRINGS, vars } from '../utils/index'

const useStore = (initial) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    hook.state =
      typeof action === STRINGS.function ? action(hook.state) : action
  })

  const setState = (action) => {
    hook.queue.push(action)
    vars.wipRoot = {
      dom: vars?.currentRoot?.dom,
      props: vars?.currentRoot?.props,
      alternate: vars?.currentRoot,
    }
    vars.nextUnitOfWork = vars.wipRoot
    vars.deletions = []
  }

  vars.wipFiber.hooks.push(hook)
  vars.hookIndex++
  return [hook.state, setState]
}

const useEffect = (effect, deps) => {
  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]

  const hasChanged = hasDepsChanged(oldHook ? oldHook.deps : undefined, deps)

  const hook = {
    tag: RYUNIX_TYPES.RYUNIX_EFFECT,
    effect: hasChanged ? effect : null,
    cancel: hasChanged && oldHook && oldHook.cancel,
    deps,
  }

  vars.wipFiber.hooks.push(hook)
  vars.hookIndex++
}

const useQuery = () => {
  vars.hookIndex++

  const oldHook =
    vars.wipFiber.alternate &&
    vars.wipFiber.alternate.hooks &&
    vars.wipFiber.alternate.hooks[vars.hookIndex]

  const hasOld = oldHook ? oldHook : undefined

  const urlSearchParams = new URLSearchParams(window.location.search)

  const params = Object.fromEntries(urlSearchParams.entries())
  const Query = hasOld ? hasOld : params

  const hook = {
    tag: RYUNIX_TYPES.RYUNIX_EFFECT,
    query: Query,
  }

  vars.wipFiber.hooks.push(hook)

  return hook.query
}

export { useStore, useEffect, useQuery }
