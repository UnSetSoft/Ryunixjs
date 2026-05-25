import {
  RYUNIX_TYPES,
  STRINGS,
  OLD_STRINGS,
  is,
  getState,
} from '../utils/index.js'
import { camelToKebab, validateUri } from './dom.js'
import { toSvgAttrName } from '../utils/svgAttributes.js'
import { resetIdCounter } from './hooks.js'
export const escapeHtml = (unsafe) => {
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
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])
const renderToStringImpl = (element) => {
  if (element == null || typeof element === 'boolean') {
    return ''
  }
  if (typeof element === 'string' || typeof element === 'number') {
    return escapeHtml(element)
  }
  if (Array.isArray(element)) {
    return element.map((child) => renderToStringImpl(child)).join('')
  }
  const vnode = element
  if (vnode.type === RYUNIX_TYPES.TEXT_ELEMENT) {
    return escapeHtml(vnode.props.nodeValue)
  }
  if (vnode.type === RYUNIX_TYPES.RYUNIX_FRAGMENT) {
    const children = vnode.props?.children || []
    return children.map((child) => renderToStringImpl(child)).join('')
  }
  if (vnode.type === RYUNIX_TYPES.RYUNIX_CONTEXT) {
    const state = getState()
    state.ssrContexts = state.ssrContexts || {}
    const ctxProps = vnode.props || {}
    const ctxId = ctxProps._contextId
    const prevCtx = state.ssrContexts[ctxId]
    if (ctxId) {
      state.ssrContexts[ctxId] = ctxProps.value
    }
    const children = ctxProps.children || []
    let result = ''
    if (Array.isArray(children)) {
      result = children.map((child) => renderToStringImpl(child)).join('')
    } else {
      result = renderToStringImpl(children)
    }
    if (ctxId) {
      state.ssrContexts[ctxId] = prevCtx
    }
    return result
  }
  if (typeof vnode.type === 'function') {
    const type = vnode.type
    const props = vnode.props || {}
    const renderedElement = type(props)
    return renderToStringImpl(renderedElement)
  }
  const type = String(vnode.type)
  const props = vnode.props || {}
  let attributes = ''
  let htmlChildren = ''
  let innerHTML = null
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children') {
      if (Array.isArray(value)) {
        htmlChildren = value.map((child) => renderToStringImpl(child)).join('')
      } else {
        htmlChildren = renderToStringImpl(value)
      }
    } else if (key === 'dangerouslySetInnerHTML') {
      const inner = value
      if (inner?.__html) {
        innerHTML = inner.__html
      }
    } else if (key === STRINGS.STYLE || key === OLD_STRINGS.STYLE) {
      const styleString = renderStyle(value)
      if (styleString) {
        attributes += ` style="${escapeHtml(styleString)}"`
      }
    } else if (key === STRINGS.CLASS_NAME || key === OLD_STRINGS.CLASS_NAME) {
      if (value) {
        attributes += ` class="${escapeHtml(value)}"`
      }
    } else if (
      !key.startsWith('on') &&
      key !== '__source' &&
      key !== '__self'
    ) {
      if (typeof value === 'boolean') {
        if (value) attributes += ` ${key}=""`
      } else if (value != null) {
        let attrName = toSvgAttrName(key)
        let validatedValue = validateUri(attrName, value)
        attributes += ` ${attrName}="${escapeHtml(validatedValue)}"`
      }
    }
  })
  if (VOID_ELEMENTS.has(type)) {
    return `<${type}${attributes} />`
  }
  const finalContent = innerHTML !== null ? innerHTML : htmlChildren
  return `<${type}${attributes}>${finalContent}</${type}>`
}
const RC_SCRIPT = `
function $RC(id, templateId) {
  var b = document.getElementById(id);
  var t = document.getElementById(templateId);
  if (b && t) {
    b.innerHTML = t.innerHTML;
    t.remove();
  }
}
`
  .replace(/\s+/g, ' ')
  .trim()
const renderToStreamImpl = async (element, push, suspenseTasks = []) => {
  if (element == null || typeof element === 'boolean') {
    return
  }
  if (element instanceof Promise) {
    element = await element
    if (element == null || typeof element === 'boolean') return
  }
  if (typeof element === 'string' || typeof element === 'number') {
    push(escapeHtml(element))
    return
  }
  if (Array.isArray(element)) {
    for (const child of element) {
      await renderToStreamImpl(child, push, suspenseTasks)
    }
    return
  }
  const vnode = element
  if (vnode.type === RYUNIX_TYPES.TEXT_ELEMENT) {
    push(escapeHtml(vnode.props.nodeValue))
    return
  }
  if (vnode.type === RYUNIX_TYPES.RYUNIX_FRAGMENT) {
    const children = vnode.props?.children || []
    for (const child of children) {
      await renderToStreamImpl(child, push, suspenseTasks)
    }
    return
  }
  if (vnode.type === RYUNIX_TYPES.RYUNIX_CONTEXT) {
    const state = getState()
    state.ssrContexts = state.ssrContexts || {}
    const ctxProps = vnode.props || {}
    const ctxId = ctxProps._contextId
    const prevCtx = state.ssrContexts[ctxId]
    if (ctxId) {
      state.ssrContexts[ctxId] = ctxProps.value
    }
    const children = ctxProps.children || []
    if (Array.isArray(children)) {
      for (const child of children) {
        await renderToStreamImpl(child, push, suspenseTasks)
      }
    } else {
      await renderToStreamImpl(children, push, suspenseTasks)
    }
    if (ctxId) {
      state.ssrContexts[ctxId] = prevCtx
    }
    return
  }
  const suspenseType = vnode.type
  const isSuspenseBoundary =
    vnode.type === RYUNIX_TYPES.RYUNIX_SUSPENSE ||
    (typeof suspenseType === 'object' &&
      suspenseType != null &&
      suspenseType.type === RYUNIX_TYPES.RYUNIX_SUSPENSE)
  if (isSuspenseBoundary) {
    const suspenseProps = vnode.props || {}
    const { fallback, children } = suspenseProps
    const id = `s-${Math.random().toString(36).slice(2, 9)}`
    push(`<!--$?--><template id="B:${id}"></template><div id="S:${id}">`)
    const task = (async () => {
      const state = getState()
      const wasBackground = state.isSuspenseBackground
      state.isSuspenseBackground = true
      let content = ''
      const subPush = (chunk) => {
        content += chunk
      }
      try {
        await renderToStreamImpl(children, subPush, suspenseTasks)
        return { id, content, success: true }
      } catch (e) {
        return { id, content: '', success: false, error: e }
      } finally {
        state.isSuspenseBackground = wasBackground
      }
    })()
    suspenseTasks.push(task)
    await renderToStreamImpl(fallback, push, suspenseTasks)
    push(`</div><!--$/-->`)
    return
  }
  let type = vnode.type
  let props = vnode.props || {}
  if (typeof type === 'function') {
    if (process.env.RYUNIX_DEBUG) {
      console.log('[SSR Debug] Rendering function:', type.name || 'anonymous')
    }
    const renderedElement = await type(props)
    await renderToStreamImpl(renderedElement, push, suspenseTasks)
    return
  }
  const hostTag = String(type)
  let attributes = ''
  let innerHTML = null
  let children = props.children || []
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children') {
    } else if (key === 'dangerouslySetInnerHTML') {
      const inner = value
      if (inner?.__html) {
        innerHTML = inner.__html
      }
    } else if (key === STRINGS.STYLE || key === OLD_STRINGS.STYLE) {
      const styleString = renderStyle(value)
      if (styleString) {
        attributes += ` style="${escapeHtml(styleString)}"`
      }
    } else if (key === STRINGS.CLASS_NAME || key === OLD_STRINGS.CLASS_NAME) {
      if (value) {
        attributes += ` class="${escapeHtml(value)}"`
      }
    } else if (
      !key.startsWith('on') &&
      key !== '__source' &&
      key !== '__self'
    ) {
      if (typeof value === 'boolean') {
        if (value) attributes += ` ${key}=""`
      } else if (value != null) {
        const attrName = toSvgAttrName(key)
        const validatedValue = validateUri(attrName, value)
        attributes += ` ${attrName}="${escapeHtml(validatedValue)}"`
      }
    }
  })
  push(`<${hostTag}${attributes}>`)
  if (innerHTML !== null) {
    push(innerHTML)
  } else {
    if (Array.isArray(children)) {
      for (const child of children) {
        await renderToStreamImpl(child, push, suspenseTasks)
      }
    } else {
      await renderToStreamImpl(children, push, suspenseTasks)
    }
  }
  if (!VOID_ELEMENTS.has(hostTag)) {
    push(`</${hostTag}>`)
  }
}
export const renderToReadableStream = (element, options = {}) => {
  const state = getState()
  const encoder = new TextEncoder()
  resetIdCounter()
  return new ReadableStream({
    async start(controller) {
      const wasServerRendering = state.isServerRendering
      state.isServerRendering = true
      state.ssrMetadata = {}
      const push = (text) => controller.enqueue(encoder.encode(text))
      const suspenseTasks = []
      try {
        const nonceAttr = options.nonce ? ` nonce="${options.nonce}"` : ''
        push(`<script${nonceAttr} data-ryunix-ssr>${RC_SCRIPT}</script>`)
        await renderToStreamImpl(element, push, suspenseTasks)
        while (suspenseTasks.length > 0) {
          const task = suspenseTasks.shift()
          const res = await task
          if (res.success) {
            push(
              `<template id="P:${res.id}" data-ryunix-ssr>${res.content}</template>`,
            )
            push(
              `<script${nonceAttr} data-ryunix-ssr>$RC("S:${res.id}", "P:${res.id}")</script>`,
            )
          }
        }
        controller.close()
      } catch (e) {
        controller.error(e)
      } finally {
        state.isServerRendering = wasServerRendering
      }
    },
  })
}
export const renderToString = (element, options = {}) => {
  const state = getState()
  const wasServerRendering = state.isServerRendering
  state.isServerRendering = true
  state.ssrMetadata = {}
  resetIdCounter()
  try {
    return renderToStringImpl(element)
  } finally {
    state.isServerRendering = wasServerRendering
  }
}
export const renderToStringAsync = async (element, options = {}) => {
  const stream = renderToReadableStream(element, options)
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += decoder.decode(value, { stream: true })
  }
  result += decoder.decode()
  return result
}
