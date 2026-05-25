/**
 * Background Service Worker — routes messages between content script and DevTools panel.
 */
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.source === 'ryunix-devtools') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id != null) {
        chrome.tabs.sendMessage(tabs[0].id, message)
      }
    })
  }
  return true
})
console.log('Ryunix DevTools extension loaded')
