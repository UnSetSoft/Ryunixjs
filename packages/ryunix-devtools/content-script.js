/**
 * Content Script - FIXED
 */

// Listen to messages from page
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (!event.data.source) return

  if (event.data.source === 'ryunix-hook') {
    chrome.runtime.sendMessage({
      source: 'ryunix-devtools',
      payload: event.data.payload
    }).catch(err => {
      console.error('[Ryunix DevTools] Error sending message:', err)
    })
  }
})

// Inject hook script
function injectHook() {
  try {
    const script = document.createElement('script')
    script.src = chrome.runtime.getURL('hook.js')
    script.onload = () => {
      script.remove()
      console.log('[Ryunix DevTools] Hook inyectado')
    }
    script.onerror = (err) => {
      console.error('[Ryunix DevTools] Error cargando hook:', err)
    }
      ; (document.head || document.documentElement).appendChild(script)
  } catch (error) {
    console.error('[Ryunix DevTools] Error inyectando hook:', error)
  }
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectHook)
} else {
  injectHook()
}