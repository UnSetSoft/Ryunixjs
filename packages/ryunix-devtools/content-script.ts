/**
 * Content Script — bridges page hook messages to the extension runtime.
 */

;(function () {
  const ext = ((globalThis as { browser?: typeof chrome }).browser ??
    chrome) as typeof chrome

  interface PageHookMessage {
    source: string
    payload?: unknown
  }

  window.addEventListener('message', (event: MessageEvent<PageHookMessage>) => {
    if (event.source !== window) return
    if (!event.data.source) return

    if (event.data.source === 'ryunix-hook') {
      ext.runtime
        .sendMessage({
          source: 'ryunix-devtools',
          payload: event.data.payload,
        })
        .catch((err: unknown) => {
          console.error('[Ryunix DevTools] Error sending message:', err)
        })
    }
  })

  function injectHook(): void {
    try {
      const script = document.createElement('script')
      script.src = ext.runtime.getURL('dist/hook.js')
      script.onload = () => {
        script.remove()
        console.log('[Ryunix DevTools] Hook injected')
      }
      script.onerror = (err: Event | string) => {
        console.error('[Ryunix DevTools] Error loading hook:', err)
      }
      ;(document.head || document.documentElement).appendChild(script)
    } catch (error) {
      console.error('[Ryunix DevTools] Error injecting hook:', error)
    }
  }

  injectHook()

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHook, { once: true })
  }
})()
