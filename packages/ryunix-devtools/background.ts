/**
 * Background Service Worker — routes messages between content script and DevTools panel.
 */

interface RyunixDevtoolsMessage {
  source?: string
  [key: string]: unknown
}

chrome.runtime.onMessage.addListener(
  (message: RyunixDevtoolsMessage, _sender, _sendResponse) => {
    if (message.source === 'ryunix-devtools') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id != null) {
          chrome.tabs.sendMessage(tabs[0].id, message)
        }
      })
    }

    return true
  },
)

console.log('Ryunix DevTools extension loaded')
