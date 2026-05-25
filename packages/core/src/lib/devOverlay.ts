import { createElement } from './createElement.js'
import { useStore, useEffect } from './hooks.js'

/**
 * @typedef {object} OverlayError
 * @property {string} [name]
 * @property {string} [message]
 * @property {string | string[]} [stack]
 * @property {{ fileName?: string, lineNumber?: number }} [__ryunix_source]
 */

/**
 * @param {unknown} propsOrError
 */
export function RyunixDevOverlay(propsOrError) {
  /** @type {Record<string, unknown> | Error | null | undefined} */
  const propsInput =
    /** @type {Record<string, unknown> | Error | null | undefined} */ propsOrError

  // If propsOrError is an event or wrapped object, try to extract error
  const rawError =
    propsInput &&
    typeof propsInput === 'object' &&
    !(propsInput instanceof Error) &&
    propsInput.nativeEvent
      ? propsInput.error
      : propsInput

  /** @type {OverlayError | null} */
  let error = null
  if (rawError instanceof Error) {
    error = rawError
  } else if (rawError && typeof rawError === 'object') {
    if ('message' in rawError) {
      error = /** @type {OverlayError} */ rawError
    } else if ('error' in rawError) {
      const nested = /** @type {Record<string, unknown>} */ rawError.error
      error =
        nested && typeof nested === 'object'
          ? /** @type {OverlayError} */ nested
          : null
    } else {
      error = /** @type {OverlayError} */ rawError
    }
  }

  // Debug string if error is broken
  const debugObjectStr = JSON.stringify(
    propsInput,
    Object.getOwnPropertyNames(propsInput || {}),
  )

  const [snippetState, setSnippet] = useStore(null)
  const [startLineState, setStartLine] = useStore(1)
  const [errorFileState, setErrorFile] = useStore('')
  const [errorLineState, setErrorLine] = useStore(0)
  const snippet = /** @type {string | null} */ snippetState
  const startLine = /** @type {number} */ startLineState
  const errorFile = /** @type {string} */ errorFileState
  const errorLine = /** @type {number} */ errorLineState

  // Normalize stack ensuring we have lines
  /** @type {string[]} */
  let stackLines = []
  if (error && error.stack) {
    stackLines =
      typeof error.stack === 'string'
        ? error.stack.split('\n').filter((/** @type {string} */ line) => {
            const trimmed = line.trim()
            if (!trimmed) return false
            if (trimmed.includes('node_modules')) return false
            // Filter out internal Ryunix core framework files to isolate user code
            const isInternal = [
              'components.js',
              'workers.js',
              'reconciler.js',
              'commits.js',
              'hooks.js',
              'errorBoundary.js',
              'serverBoundary.js',
              'app-router.js',
              'app-router-server.js',
              'render.js',
              'createElement.js',
              'index.js',
            ].some((file) => trimmed.includes(file))
            return !isInternal
          })
        : Array.isArray(error.stack)
          ? /** @type {string[]} */ error.stack
          : []
  }

  const errorName =
    error && typeof error.name === 'string' ? error.name : 'Unknown Error Type'
  const errorMessage =
    error && typeof error.message === 'string'
      ? error.message
      : `Raw unhandled error. Debug: ${debugObjectStr}`

  useEffect(() => {
    let targetPath = null
    let targetLine = null

    // 1. Direct JSX __source mapping (injected by Webpack/SWC)
    const ryunixSource = error?.__ryunix_source
    if (ryunixSource?.fileName) {
      targetPath = ryunixSource.fileName
      targetLine = ryunixSource.lineNumber ?? null
    }

    // 2. Fallback to Regex Stack Parsing
    if (!targetPath || !targetLine) {
      for (let i = 0; i < stackLines.length; i++) {
        const line = stackLines[i]
        if (!line.includes(':')) continue

        // Deterministic string-based parsing (no regex on uncontrolled data)
        let matchedPath = null
        let matchedLine = null

        // V8 format: "at fn (file:line:col)" — extract content between parens
        const parenOpen = line.indexOf('(')
        const parenClose = line.lastIndexOf(')')
        if (parenOpen !== -1 && parenClose > parenOpen) {
          const inner = line.slice(parenOpen + 1, parenClose)
          const c2 = inner.lastIndexOf(':')
          const c1 = c2 > 0 ? inner.lastIndexOf(':', c2 - 1) : -1
          if (c1 > 0) {
            const col = inner.slice(c2 + 1)
            const ln = inner.slice(c1 + 1, c2)
            if (/^\d+$/.test(ln) && /^\d+$/.test(col)) {
              matchedPath = inner.slice(0, c1)
              matchedLine = parseInt(ln, 10)
            }
          }
        }

        // V8 format without parens: "at file:line:col"
        if (!matchedPath) {
          const trimmed = line.trim()
          if (trimmed.startsWith('at ')) {
            const rest = trimmed.slice(3).trim()
            const c2 = rest.lastIndexOf(':')
            const c1 = c2 > 0 ? rest.lastIndexOf(':', c2 - 1) : -1
            if (c1 > 0) {
              const col = rest.slice(c2 + 1)
              const ln = rest.slice(c1 + 1, c2)
              if (/^\d+$/.test(ln) && /^\d+$/.test(col)) {
                matchedPath = rest.slice(0, c1)
                matchedLine = parseInt(ln, 10)
              }
            }
          }
        }

        // Ryunix format: "file.ryx:line" or "file.jsx:line"
        if (!matchedPath) {
          const exts = ['.ryx', '.jsx', '.js', '.ts', '.tsx']
          const c1 = line.lastIndexOf(':')
          if (c1 > 0) {
            const ln = line.slice(c1 + 1).trim()
            const filePart = line.slice(0, c1).trim()
            if (
              /^\d+$/.test(ln) &&
              exts.some((ext) => filePart.endsWith(ext))
            ) {
              matchedPath = filePart
              matchedLine = parseInt(ln, 10)
            }
          }
        }

        if (matchedPath && matchedLine) {
          targetPath = matchedPath
          targetLine = matchedLine
          break
        }
      }
    }

    if (targetPath && targetLine) {
      setErrorFile(targetPath)
      setErrorLine(targetLine)
      fetch(
        `/_ryunix/source?file=${encodeURIComponent(targetPath)}&line=${targetLine}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.snippet) {
            setSnippet(data.snippet)
            setStartLine(data.startLine)
          }
        })
        .catch((err) => console.error('Failed to fetch source snippet', err))
    }
  }, [error])

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2147483647,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  }

  const modalStyle = {
    backgroundColor: '#0c0c0c',
    width: '100%',
    maxWidth: '1000px',
    maxHeight: '90vh',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid #333',
  }

  const headerStyle = {
    backgroundColor: '#161616',
    padding: '16px 24px',
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  const badgeStyle = {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const contentStyle = {
    padding: '32px',
    overflowY: 'auto',
    flex: 1,
    color: '#fff',
  }

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    fontFamily: 'ui-monospace, monospace',
    wordBreak: 'break-word',
    lineHeight: 1.4,
  }

  const snippetContainerStyle = {
    backgroundColor: '#000',
    borderRadius: '8px',
    border: '1px solid #333',
    padding: '16px',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '14px',
    overflowX: 'auto',
    color: '#d1d5db',
    marginBottom: '32px',
    whiteSpace: 'pre-wrap',
    maxHeight: '150px',
    height: 'auto',
  }

  /** @param {boolean} isErrorLine */
  const lineStyle = (isErrorLine) => ({
    display: 'flex',
    backgroundColor: isErrorLine ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
    padding: '2px 8px',
    borderRadius: '4px',
    borderLeft: isErrorLine ? '3px solid #ef4444' : '3px solid transparent',
  })

  const snippetLines = snippet ? snippet.split('\n') : []

  let badgeText = 'UNHANDLED RUNTIME ERROR'
  if (
    errorName &&
    errorName !== 'Error' &&
    errorName !== 'Unknown Error Type'
  ) {
    badgeText = errorName.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase()
  }

  return createElement(
    'div',
    { style: overlayStyle },
    createElement(
      'div',
      { style: modalStyle },
      createElement(
        'div',
        { style: headerStyle },
        createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
          createElement('span', { style: badgeStyle }, badgeText),
          createElement(
            'span',
            { style: { color: '#9ca3af', fontSize: '14px' } },
            'Ryunix Development',
          ),
        ),
        createElement(
          'button',
          {
            onClick: () => window.location.reload(),
            style: {
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              outline: 'none',
            },
            title: 'Reload page',
          },
          createElement(
            'svg',
            {
              width: '20',
              height: '20',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            },
            createElement('path', {
              d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8',
            }),
            createElement('path', { d: 'M3 3v5h5' }),
          ),
        ),
      ),
      createElement(
        'div',
        { style: contentStyle },
        createElement(
          'h1',
          { style: titleStyle },
          createElement('span', { style: { color: '#f87171' } }, errorName),
          ': ',
          errorMessage,
        ),

        errorFile &&
          createElement(
            'div',
            {
              style: {
                marginBottom: '16px',
                color: '#9ca3af',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              },
            },
            createElement(
              'svg',
              {
                width: '16',
                height: '16',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              },
              createElement('path', {
                d: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z',
              }),
              createElement('polyline', { points: '13 2 13 9 20 9' }),
            ),
            errorFile,
            ':',
            errorLine,
          ),

        snippet &&
          createElement(
            'div',
            { style: snippetContainerStyle },
            createElement(
              'div',
              { style: { display: 'flex', flexDirection: 'column' } },
              ...snippetLines.map(
                (
                  /** @type {string} */ lineText,
                  /** @type {number} */ index,
                ) => {
                  const currentLineNumber = startLine + index
                  const isErrorLine = currentLineNumber === errorLine
                  return createElement(
                    'div',
                    { key: index, style: lineStyle(isErrorLine) },
                    createElement(
                      'span',
                      {
                        style: {
                          color: '#6b7280',
                          width: '40px',
                          userSelect: 'none',
                          textAlign: 'right',
                          marginRight: '16px',
                          display: 'inline-block',
                        },
                      },
                      currentLineNumber,
                    ),
                    createElement(
                      'span',
                      {
                        style: {
                          color: isErrorLine ? '#f87171' : '#e5e7eb',
                          whiteSpace: 'pre',
                        },
                      },
                      lineText || ' ',
                    ),
                  )
                },
              ),
            ),
          ),

        createElement(
          'div',
          { style: { marginBottom: '16px' } },
          createElement(
            'p',
            {
              style: {
                color: '#9ca3af',
                fontSize: '14px',
                marginBottom: '8px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
            },
            'Call Stack',
          ),
          createElement(
            'div',
            { style: snippetContainerStyle },
            stackLines.length > 0
              ? createElement(
                  'ul',
                  {
                    style: {
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    },
                  },
                  ...stackLines.map(
                    (/** @type {string} */ line, /** @type {number} */ i) => {
                      if (
                        i === 0 &&
                        (line.startsWith('Error:') ||
                          line.startsWith('TypeError:'))
                      )
                        return null

                      // Deterministic string-based stack frame parsing (no polynomial regex)
                      const trimmed = line.trim()
                      let fnName = '<anonymous>'
                      let filePath = line

                      // V8 format: "at fnName (file:line:col)" or "at file:line:col"
                      if (trimmed.startsWith('at ')) {
                        const rest = trimmed.slice(3)
                        const parenOpen = rest.indexOf('(')
                        const parenClose = rest.lastIndexOf(')')
                        if (parenOpen !== -1 && parenClose > parenOpen) {
                          fnName =
                            rest.slice(0, parenOpen).trim() || '<anonymous>'
                          filePath = rest.slice(parenOpen + 1, parenClose)
                        } else {
                          // "at file:line:col" — no function name
                          if (rest.includes(':')) {
                            fnName = '<anonymous>'
                          } else {
                            fnName = rest
                          }
                          filePath = rest
                        }
                      }
                      // Firefox format: "fnName@file:line:col"
                      else if (trimmed.includes('@')) {
                        const atIdx = trimmed.indexOf('@')
                        fnName = trimmed.slice(0, atIdx) || '<anonymous>'
                        filePath = trimmed.slice(atIdx + 1)
                      }
                      // Ryunix format: "fnName file.ext:line"
                      else {
                        const exts = ['.ryx', '.jsx', '.js', '.ts', '.tsx']
                        const parts = trimmed.split(/\s+/)
                        if (parts.length >= 2) {
                          const lastPart = parts[parts.length - 1]
                          const colonIdx = lastPart.indexOf(':')
                          const fileCandidate =
                            colonIdx > 0
                              ? lastPart.slice(0, colonIdx)
                              : lastPart
                          if (exts.some((ext) => fileCandidate.endsWith(ext))) {
                            fnName = parts.slice(0, -1).join(' ')
                            filePath = lastPart
                          } else {
                            fnName = parts[0]
                            filePath = parts.slice(1).join(' ')
                          }
                        }
                      }

                      return createElement(
                        'li',
                        { key: i },
                        createElement(
                          'span',
                          { style: { color: '#60a5fa', fontWeight: 600 } },
                          fnName,
                        ),
                        createElement(
                          'div',
                          {
                            style: {
                              color: '#6b7280',
                              marginTop: '4px',
                              paddingLeft: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            },
                          },
                          createElement(
                            'svg',
                            {
                              width: '12',
                              height: '12',
                              viewBox: '0 0 24 24',
                              fill: 'none',
                              stroke: 'currentColor',
                              strokeWidth: '2',
                              strokeLinecap: 'round',
                              strokeLinejoin: 'round',
                            },
                            createElement('path', {
                              d: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z',
                            }),
                            createElement('polyline', {
                              points: '13 2 13 9 20 9',
                            }),
                          ),
                          filePath,
                        ),
                      )
                    },
                  ),
                )
              : createElement(
                  'div',
                  { style: { color: '#6b7280', fontStyle: 'italic' } },
                  'No stack trace available.',
                ),
          ),
        ),
      ),
    ),
  )
}
