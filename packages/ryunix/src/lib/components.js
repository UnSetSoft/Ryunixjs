import { createDom } from './dom'
import { reconcileChildren } from './reconciler'
import { RYUNIX_TYPES, getState } from '../utils/index'
import { createElement } from './createElement'

const updateFunctionComponent = (fiber) => {
  const state = getState()
  state.wipFiber = fiber
  state.hookIndex = 0
  state.wipFiber.hooks = []

  const children = [fiber.type(fiber.props)]

  if (fiber.type._contextId && fiber.props.value !== undefined) {
    fiber._contextId = fiber.type._contextId
    fiber._contextValue = fiber.props.value
  }

  reconcileChildren(fiber, children)
}

const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

const Image = ({ src, ...props }) => {
  return createElement('img', { ...props, src })
}

export { updateFunctionComponent, updateHostComponent, Image }