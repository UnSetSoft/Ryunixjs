import {
  RYUNIX_TYPES,
  STRINGS,
  OLD_STRINGS,
  is,
  getState,
} from '../../utils/index.js'
import { camelToKebab, validateUri } from '../reconciler/dom.js'
import { toSvgAttrName } from '../../utils/svgAttributes.js'
import { resetIdCounter } from '../hooks/hooks.js'
import type {
  RyunixElement,
  RyunixNode,
  RyunixRenderToStringOptions,
  RyunixSuspenseTask,
} from '../../types/internal.js'

interface SuspenseTaskResult {
  id: string
  content: string
  success: boolean
  error?: unknown
}

interface HostRenderProps {
  attributes: string
  innerHTML: string | null
  htmlChildren: string
}

const ASYNC_RENDER_ERROR =
  'Async components require renderToStringAsync or renderToReadableStream, not renderToString'

export const escapeHtml = (unsafe: unknown): string => {
  if (typeof unsafe !== 'string') return String(unsafe)
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const renderStyle = (styleObj: Record<string, unknown>): string => {
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

const normalizeChildren = (
  children: RyunixNode | RyunixNode[] | undefined,
): RyunixNode[] => {
  if (children == null) return []
  return Array.isArray(children) ? children : [children]
}

const assertSyncRenderResult = (rendered: RyunixNode): RyunixNode => {
  if (
    rendered != null &&
    typeof rendered === 'object' &&
    'then' in rendered &&
    typeof (rendered as { then?: unknown }).then === 'function'
  ) {
    throw new Error(ASYNC_RENDER_ERROR)
  }
  return rendered
}

const buildHostProps = (
  props: Record<string, unknown>,
  renderChild: (child: RyunixNode) => string,
): HostRenderProps => {
  let attributes = ''
  let htmlChildren = ''
  let innerHTML: string | null = null

  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children') {
      if (Array.isArray(value)) {
        htmlChildren = value
          .map((child) => renderChild(child as RyunixNode))
          .join('')
      } else {
        htmlChildren = renderChild(value as RyunixNode)
      }
    } else if (key === 'dangerouslySetInnerHTML') {
      const inner = value as { __html?: string } | null | undefined
      if (inner?.__html) {
        innerHTML = inner.__html
      }
    } else if (key === STRINGS.STYLE || key === OLD_STRINGS.STYLE) {
      const styleString = renderStyle(value as Record<string, unknown>)
      if (styleString) {
        attributes += ` style="${escapeHtml(styleString)}"`
      }
    } else if (key === STRINGS.CLASS_NAME || key === OLD_STRINGS.CLASS_NAME) {
      if (value) {
        attributes += ` class="${escapeHtml(value)}"`
      }
    } else if (
      !key.startsWith('on') &&
      key !== 'key' &&
      key !== 'ref' &&
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

  return { attributes, innerHTML, htmlChildren }
}

const formatHostOpenTag = (hostTag: string, attributes: string): string => {
  if (VOID_ELEMENTS.has(hostTag)) {
    return `<${hostTag}${attributes} />`
  }
  return `<${hostTag}${attributes}>`
}

const beginSsrRender = (): void => {
  const state = getState()
  state.isServerRendering = true
  state.ssrMetadata = {}
  state.ssrContexts = {}
  resetIdCounter()
}

const renderToStringImpl = (element: RyunixNode | RyunixNode[]): string => {
  if (element == null || typeof element === 'boolean') {
    return ''
  }

  if (typeof element === 'string' || typeof element === 'number') {
    return escapeHtml(element)
  }

  if (Array.isArray(element)) {
    return element.map((child) => renderToStringImpl(child)).join('')
  }

  const vnode = element as RyunixElement

  if (vnode.type === RYUNIX_TYPES.TEXT_ELEMENT) {
    return escapeHtml(vnode.props.nodeValue as string)
  }

  if (vnode.type === RYUNIX_TYPES.RYUNIX_FRAGMENT) {
    const children = normalizeChildren(vnode.props?.children)
    return children.map((child) => renderToStringImpl(child)).join('')
  }

  if (vnode.type === RYUNIX_TYPES.RYUNIX_CONTEXT) {
    const state = getState()
    state.ssrContexts = state.ssrContexts || {}
    const ctxProps = (vnode.props || {}) as {
      _contextId?: string | symbol
      value?: unknown
      children?: RyunixNode | RyunixNode[]
    }
    const ctxId = ctxProps._contextId
    const prevCtx = ctxId ? state.ssrContexts[ctxId] : undefined

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
    const type = vnode.type as (props: Record<string, unknown>) => RyunixNode
    const props = vnode.props || {}
    const renderedElement = assertSyncRenderResult(type(props))
    return renderToStringImpl(renderedElement)
  }

  if (vnode.type == null) {
    return ''
  }

  const type = String(vnode.type)
  if (type === 'undefined') {
    return ''
  }
  const props = vnode.props || {}
  const { attributes, innerHTML, htmlChildren } = buildHostProps(
    props,
    renderToStringImpl,
  )

  if (VOID_ELEMENTS.has(type)) {
    return formatHostOpenTag(type, attributes)
  }

  const finalContent = innerHTML !== null ? innerHTML : htmlChildren
  return `${formatHostOpenTag(type, attributes)}${finalContent}</${type}>`
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

const renderToStreamImpl = async (
  element: RyunixNode | RyunixNode[] | Promise<RyunixNode>,
  push: (chunk: string) => void,
  suspenseTasks: RyunixSuspenseTask[] = [],
): Promise<void> => {
  if (element instanceof Promise) {
    element = await element
  }

  if (element == null || typeof element === 'boolean') {
    return
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

  const vnode = element as RyunixElement

  if (vnode.type === RYUNIX_TYPES.TEXT_ELEMENT) {
    push(escapeHtml(vnode.props.nodeValue as string))
    return
  }

  if (vnode.type === RYUNIX_TYPES.RYUNIX_FRAGMENT) {
    const children = normalizeChildren(vnode.props?.children)
    for (const child of children) {
      await renderToStreamImpl(child, push, suspenseTasks)
    }
    return
  }

  if (vnode.type === RYUNIX_TYPES.RYUNIX_CONTEXT) {
    const state = getState()
    state.ssrContexts = state.ssrContexts || {}
    const ctxProps = (vnode.props || {}) as {
      _contextId?: string | symbol
      value?: unknown
      children?: RyunixNode | RyunixNode[]
    }
    const ctxId = ctxProps._contextId
    const prevCtx = ctxId ? state.ssrContexts[ctxId] : undefined

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
      (suspenseType as { type?: symbol }).type === RYUNIX_TYPES.RYUNIX_SUSPENSE)
  if (isSuspenseBoundary) {
    const suspenseProps = (vnode.props || {}) as {
      fallback?: RyunixNode
      children?: RyunixNode | RyunixNode[]
    }
    const { fallback, children } = suspenseProps
    const id = `s-${Math.random().toString(36).slice(2, 9)}`

    push(`<!--$?--><template id="B:${id}"></template><div id="S:${id}">`)

    const task = (async (): Promise<SuspenseTaskResult> => {
      const state = getState()
      const wasBackground = state.isSuspenseBackground
      state.isSuspenseBackground = true

      let content = ''
      const subPush = (chunk: string) => {
        content += chunk
      }
      try {
        await renderToStreamImpl(children as RyunixNode, subPush, suspenseTasks)
        return { id, content, success: true }
      } catch (e) {
        return { id, content: '', success: false, error: e }
      } finally {
        state.isSuspenseBackground = wasBackground
      }
    }) as RyunixSuspenseTask

    suspenseTasks.push(task)

    await renderToStreamImpl(fallback as RyunixNode, push, suspenseTasks)
    push(`</div><!--$/-->`)
    return
  }

  const type = vnode.type
  const props = vnode.props || {}

  if (type == null) {
    return
  }

  if (typeof type === 'function') {
    if (process.env.RYUNIX_DEBUG) {
      console.log('[SSR Debug] Rendering function:', type.name || 'anonymous')
    }
    const renderedElement = await (
      type as (
        props: Record<string, unknown>,
      ) => RyunixNode | Promise<RyunixNode>
    )(props)
    await renderToStreamImpl(renderedElement, push, suspenseTasks)
    return
  }

  const hostTag = String(type)
  if (hostTag === 'undefined') {
    return
  }
  const children = props.children || []
  const { attributes, innerHTML } = buildHostProps(props, () => '')

  push(formatHostOpenTag(hostTag, attributes))

  if (innerHTML !== null) {
    push(innerHTML)
    if (!VOID_ELEMENTS.has(hostTag)) {
      push(`</${hostTag}>`)
    }
  } else if (!VOID_ELEMENTS.has(hostTag)) {
    if (Array.isArray(children)) {
      for (const child of children) {
        await renderToStreamImpl(child, push, suspenseTasks)
      }
    } else {
      await renderToStreamImpl(children as RyunixNode, push, suspenseTasks)
    }
    push(`</${hostTag}>`)
  }
}

const handleSuspenseTaskResult = (
  res: SuspenseTaskResult,
  push: (text: string) => void,
  nonceAttr: string,
): void => {
  if (res.success) {
    push(`<template id="P:${res.id}" data-ryunix-ssr>${res.content}</template>`)
    push(
      `<script${nonceAttr} data-ryunix-ssr>$RC("S:${res.id}", "P:${res.id}")</script>`,
    )
    return
  }

  const message =
    res.error instanceof Error
      ? res.error.message
      : String(res.error ?? 'Unknown error')
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Ryunix SSR] Suspense boundary failed:', res.error)
  }
  push(`<!-- Ryunix Suspense error: ${escapeHtml(message)} -->`)
}

export const renderToReadableStream = (
  element: RyunixNode,
  options: RyunixRenderToStringOptions = {},
): ReadableStream<Uint8Array> => {
  const state = getState()
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const wasServerRendering = state.isServerRendering
      beginSsrRender()

      const push = (text: string) => controller.enqueue(encoder.encode(text))
      const suspenseTasks: RyunixSuspenseTask[] = []

      try {
        const nonceAttr = options.nonce ? ` nonce="${options.nonce}"` : ''
        push(`<script${nonceAttr} data-ryunix-ssr>${RC_SCRIPT}</script>`)

        await renderToStreamImpl(element, push, suspenseTasks)

        while (suspenseTasks.length > 0) {
          const task = suspenseTasks.shift()
          if (!task) continue
          const res = await task()
          handleSuspenseTaskResult(res, push, nonceAttr)
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

export const renderToString = (
  element: RyunixNode,
  _options: RyunixRenderToStringOptions = {},
): string => {
  const state = getState()
  const wasServerRendering = state.isServerRendering
  beginSsrRender()

  try {
    return renderToStringImpl(element)
  } finally {
    state.isServerRendering = wasServerRendering
  }
}

export const renderToStringAsync = async (
  element: RyunixNode,
  options: RyunixRenderToStringOptions = {},
): Promise<string> => {
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
