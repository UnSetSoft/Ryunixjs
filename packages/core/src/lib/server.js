import { RYUNIX_TYPES, STRINGS, OLD_STRINGS, is, getState } from '../utils/index'
import { camelToKebab } from './dom'
import { toSvgAttrName } from '../utils/svgAttributes'

const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return String(unsafe)
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const renderStyle = (styleObj) => {
  if (!is.object(styleObj) || is.null(styleObj)) return ''
  return Object.entries(styleObj)
    .filter(([_, value]) => value != null)
    .map(([key, value]) => `${camelToKebab(key)}:${value}`)
    .join(';')
}

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
])

const renderToStringImpl = (element) => {
  if (element == null || typeof element === 'boolean') {
    return ''
  }

  if (typeof element === 'string' || typeof element === 'number') {
    return escapeHtml(element)
  }

  if (element.type === RYUNIX_TYPES.TEXT_ELEMENT) {
    return escapeHtml(element.props.nodeValue)
  }

  if (element.type === RYUNIX_TYPES.RYUNIX_FRAGMENT) {
    const children = element.props?.children || []
    return children.map(child => renderToStringImpl(child)).join('')
  }

  if (element.type === RYUNIX_TYPES.RYUNIX_CONTEXT) {
    // Context Providers just render their children transparently on the server
    const state = getState()
    state.ssrContexts = state.ssrContexts || {}
    const ctxId = element.props?._contextId
    const prevCtx = state.ssrContexts[ctxId]

    if (ctxId) {
      state.ssrContexts[ctxId] = element.props?.value
    }

    const children = element.props?.children || []
    let result = ''
    if (Array.isArray(children)) {
      result = children.map(child => renderToStringImpl(child)).join('')
    } else {
      result = renderToStringImpl(children)
    }

    if (ctxId) {
      state.ssrContexts[ctxId] = prevCtx
    }

    return result
  }

  if (typeof element.type === 'function') {
    // It's a functional component
    const props = element.props || {}
    const renderedElement = element.type(props)
    return renderToStringImpl(renderedElement)
  }

  // It's a standard host element
  const type = element.type
  const props = element.props || {}

  let attributes = ''
  let htmlChildren = ''
  let innerHTML = null

  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children') {
      if (Array.isArray(value)) {
        htmlChildren = value.map(child => renderToStringImpl(child)).join('')
      } else {
        htmlChildren = renderToStringImpl(value)
      }
    } else if (key === 'dangerouslySetInnerHTML' && value?.__html) {
      innerHTML = value.__html
    } else if (key === STRINGS.STYLE || key === OLD_STRINGS.STYLE) {
      const styleString = renderStyle(value)
      if (styleString) {
        attributes += ` style="${escapeHtml(styleString)}"`
      }
    } else if (key === STRINGS.CLASS_NAME || key === OLD_STRINGS.CLASS_NAME) {
      if (value) {
        attributes += ` class="${escapeHtml(value)}"`
      }
    } else if (!key.startsWith('on')) { // Ignore event listeners
      if (typeof value === 'boolean') {
        if (value) attributes += ` ${key}=""`
      } else if (value != null) {
        let attrName = toSvgAttrName(key)

        attributes += ` ${attrName}="${escapeHtml(value)}"`
      }
    }
  })

  if (VOID_ELEMENTS.has(type)) {
    return `<${type}${attributes} />`
  }

  const finalContent = innerHTML !== null ? innerHTML : htmlChildren

  return `<${type}${attributes}>${finalContent}</${type}>`
}

export const renderToString = (element) => {
  const state = getState()
  const wasServerRendering = state.isServerRendering
  state.isServerRendering = true
  try {
    return renderToStringImpl(element)
  } finally {
    state.isServerRendering = wasServerRendering
  }
}
