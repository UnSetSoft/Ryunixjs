import { createDom } from './dom'
import { reconcileChildren } from './reconciler'
import { RYUNIX_TYPES, vars } from '../utils/index'
import { createElement } from './createElement'

/**
 * This function updates a function component by setting up a work-in-progress fiber, resetting the
 * hook index, creating an empty hooks array, rendering the component, and reconciling its children.
 * @param fiber - The fiber parameter is an object that represents a node in the fiber tree. It
 * contains information about the component, its props, state, and children. In this function, it is
 * used to update the state of the component and its children.
 */
const updateFunctionComponent = (fiber) => {
  vars.wipFiber = fiber
  vars.hookIndex = 0
  vars.wipFiber.hooks = []
  const children = [fiber.type(fiber.props)]

  // Aquí detectamos si es Provider para guardar contexto y valor en fiber
  if (fiber.type._contextId && fiber.props.value !== undefined) {
    fiber._contextId = fiber.type._contextId
    fiber._contextValue = fiber.props.value
  }

  reconcileChildren(fiber, children)
}

/**
 * This function updates a host component's DOM element and reconciles its children.
 * @param fiber - A fiber is a unit of work in Ryunix that represents a component and its state. It
 * contains information about the component's type, props, and children, as well as pointers to other
 * fibers in the tree.
 */
const updateHostComponent = (fiber) => {
  const children = Array.isArray(fiber.props.children)
    ? fiber.props.children.flat()
    : [fiber.props.children]

  if (fiber.type === RYUNIX_TYPES.RYUNIX_FRAGMENT) {
    reconcileChildren(fiber, children)
  } else {
    if (!fiber.dom) {
      fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, children)
  }
}

/* Internal components*/

/**
 * The function `optimizationImageApi` optimizes image URLs by adding query parameters for width,
 * height, quality, and extension, and handles local and remote image sources.
 * @returns The function `optimizationImageApi` returns either the original `src` if it is a local
 * image and the page is being run on localhost, or it returns a modified image URL with optimization
 * parameters added if the `src` is not local.
 */
const optimizationImageApi = ({ src, props }) => {
  const query = new URLSearchParams()
  const apiEndpoint = 'https://image.unsetsoft.com'

  const isLocal = !src.startsWith('http') || !src.startsWith('https')

  if (props.width) query.set('width', props.width)
  if (props.height) query.set('width', props.height)
  if (props.quality) query.set('quality', props.quality)

  const extension = props.extension ? `@${props.extension}` : ''

  const localhost =
    window.location.origin === 'http://localhost:3000' ||
    window.location.origin === 'http://localhost:5173' ||
    window.location.origin === 'http://localhost:4173'

  if (isLocal) {
    if (localhost) {
      console.warn(
        'Image optimizations only work with full links and must not contain localhost.',
      )
      return src
    }

    return `${window.location.origin}/${src}`
  }

  return `${apiEndpoint}/image/${src}${extension}?${query.toString()}`
}

/**
 * The `Image` function in JavaScript optimizes image loading based on a specified optimization flag.
 * @returns An `<img>` element is being returned with the specified `src` and other props passed to the
 * `Image` component. The `src` is either the original `src` value or the result of calling
 * `optimizationImageApi` function with `src` and `props` if `optimization` is set to 'true'.
 */
const Image = ({ src, ...props }) => {
  const optimization = props.optimization === 'true' ? true : false

  const url = optimization
    ? optimizationImageApi({
        src,
        props,
      })
    : src

  const ImageProps = {
    src: url,
    props,
  }

  return createElement('img', ImageProps, null)
}

export { updateFunctionComponent, updateHostComponent, Image }
