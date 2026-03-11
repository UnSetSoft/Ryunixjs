import { RYUNIX_TYPES, STRINGS, OLD_STRINGS, is, getState } from '../utils/index.js'
import { camelToKebab } from './dom.js'
import { toSvgAttrName } from '../utils/svgAttributes.js'

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

  if (Array.isArray(element)) {
    return element.map(child => renderToStringImpl(child)).join('')
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
    const type = element.type
    const props = element.props || {}
    if (type.ryunix_client_id) {
      const clientId = type.ryunix_client_id
      const serializedProps = JSON.stringify(props)
      const renderedElement = type(props)
      const content = renderToStringImpl(renderedElement)
      return `<div data-ryunix-island="${clientId}" data-props='${escapeHtml(serializedProps)}'>${content}</div>`
    }
    const renderedElement = type(props)
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

const RC_SCRIPT = `
function $RC(id, templateId) {
  var b = document.getElementById(id);
  var t = document.getElementById(templateId);
  if (b && t) {
    b.innerHTML = t.innerHTML;
    t.remove();
  }
}
`.replace(/\s+/g, ' ').trim()

const renderToStreamImpl = async (element, push, suspenseTasks = []) => {
  if (element == null || typeof element === 'boolean') {
    return
  }

  // Await the element if it's a promise (e.g. from an async Server Component directly rendered)
  if (element instanceof Promise) {
    element = await element;
    if (element == null || typeof element === 'boolean') return;
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

  if (element.type === RYUNIX_TYPES.TEXT_ELEMENT) {
    push(escapeHtml(element.props.nodeValue))
    return
  }

  if (element.type === RYUNIX_TYPES.RYUNIX_FRAGMENT) {
    const children = element.props?.children || []
    for (const child of children) {
      await renderToStreamImpl(child, push, suspenseTasks)
    }
    return
  }

  if (element.type === RYUNIX_TYPES.RYUNIX_CONTEXT) {
    const state = getState()
    state.ssrContexts = state.ssrContexts || {}
    const ctxId = element.props?._contextId
    const prevCtx = state.ssrContexts[ctxId]

    if (ctxId) {
      state.ssrContexts[ctxId] = element.props?.value
    }

    const children = element.props?.children || []
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

  // Handle Suspense specifically
  if (element.type === RYUNIX_TYPES.RYUNIX_SUSPENSE || element.type?.type === RYUNIX_TYPES.RYUNIX_SUSPENSE) {
    const { fallback, children } = element.props
    const id = `s-${Math.random().toString(36).slice(2, 9)}`

    // In universal mode, Suspense renders children if ready, or fallback if pending.
    // BUT we want to force a background task for the REAL children if we hit a lazy component.

    push(`<!--$?--><template id="B:${id}"></template><div id="S:${id}">`)

    // 1. Start rendering the actual content in the background
    const task = (async () => {
      const state = getState()
      const wasBackground = state.isSuspenseBackground
      state.isSuspenseBackground = true

      let content = ''
      const subPush = (chunk) => content += chunk
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

    // 2. Render fallback immediately for the main stream
    await renderToStreamImpl(fallback, push, suspenseTasks)
    push(`</div><!--$/-->`)
    return
  }

  let type = element.type
  let props = element.props || {}

  if (typeof type === 'function') {
    console.log('[SSR Debug] Rendering function:', type.name || 'anonymous', { isIsland: !!type.ryunix_client_id, clientId: type.ryunix_client_id });
    if (type.ryunix_client_id) {
      const clientId = type.ryunix_client_id
      const replacer = (key, value) => {
        if (value && typeof value === 'object' && value.type && typeof value.type === 'function') {
          if (value.type.name === 'ServerBoundary' || value.type.ryunix_type === 'RYUNIX_SERVER_BOUNDARY') {
            return {
              type: 'div',
              props: {
                ...value.props,
                'data-ryunix-server': value.props.id || 'unknown',
                style: { display: 'contents' },
                children: []
              }
            }
          }
        }
        return value;
      }
      const serializedProps = JSON.stringify(props, replacer)
      push(`<div data-ryunix-island="${clientId}" data-props='${escapeHtml(serializedProps)}'>`)
      const renderedElement = await type(props)
      await renderToStreamImpl(renderedElement, push, suspenseTasks)
      push(`</div>`)
      return
    }
    const renderedElement = await type(props)
    await renderToStreamImpl(renderedElement, push, suspenseTasks)
    return
  }

  // It's a standard host element
  let attributes = ''
  let innerHTML = null
  let children = props.children || []

  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children') {
      // Ignored here, handled below
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
    } else if (!key.startsWith('on')) {
      if (typeof value === 'boolean') {
        if (value) attributes += ` ${key}=""`
      } else if (value != null) {
        attributes += ` ${toSvgAttrName(key)}="${escapeHtml(value)}"`
      }
    }
  })

  push(`<${type}${attributes}>`)

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

  if (!VOID_ELEMENTS.has(type)) {
    push(`</${type}>`)
  }
}

export const renderToReadableStream = (element) => {
  const state = getState()
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const wasServerRendering = state.isServerRendering
      state.isServerRendering = true

      const push = (text) => controller.enqueue(encoder.encode(text))
      const suspenseTasks = []

      try {
        // 0. Inject RC helper script first
        push(`<script>${RC_SCRIPT}</script>`)

        // 1. Render initial tree (with fallbacks)
        await renderToStreamImpl(element, push, suspenseTasks)

        // 2. Process suspense tasks as they complete
        // For now, we wait for all, but in a real streaming scenario,
        // we could push them as they resolve.
        while (suspenseTasks.length > 0) {
          const task = suspenseTasks.shift()
          const res = await task
          if (res.success) {
            push(`<template id="P:${res.id}">${res.content}</template>`)
            push(`<script>$RC("S:${res.id}", "P:${res.id}")</script>`)
          }
        }

        controller.close()
      } catch (e) {
        controller.error(e)
      } finally {
        state.isServerRendering = wasServerRendering
      }
    }
  })
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
