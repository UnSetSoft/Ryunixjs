/**
 * Background Service Worker — routes messages between content script and DevTools panel.
 */

;(function () {
  const ext = ((globalThis as { browser?: typeof chrome }).browser ??
    chrome) as typeof chrome

  interface RyunixDevtoolsMessage {
    source?: string
    [key: string]: unknown
  }

  ext.runtime.onMessage.addListener(
    (message: RyunixDevtoolsMessage, _sender, _sendResponse) => {
      if (message.source === 'ryunix-devtools') {
        ext.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id != null) {
            ext.tabs.sendMessage(tabs[0].id, message)
          }
        })
      }

      return true
    },
  )

  console.log('Ryunix DevTools extension loaded')
})()
