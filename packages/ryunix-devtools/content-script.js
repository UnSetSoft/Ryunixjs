/**
 * Content Script — bridges page hook messages to the extension runtime.
 */
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (!event.data.source) return
  if (event.data.source === 'ryunix-hook') {
    chrome.runtime
      .sendMessage({
        source: 'ryunix-devtools',
        payload: event.data.payload,
      })
      .catch((err) => {
        console.error('[Ryunix DevTools] Error sending message:', err)
      })
  }
})
function injectHook() {
  try {
    const script = document.createElement('script')
    script.src = chrome.runtime.getURL('hook.js')
    script.onload = () => {
      script.remove()
      console.log('[Ryunix DevTools] Hook injected')
    }
    script.onerror = (err) => {
      console.error('[Ryunix DevTools] Error loading hook:', err)
    }
    ;(document.head || document.documentElement).appendChild(script)
  } catch (error) {
    console.error('[Ryunix DevTools] Error injecting hook:', error)
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectHook)
} else {
  injectHook()
}
