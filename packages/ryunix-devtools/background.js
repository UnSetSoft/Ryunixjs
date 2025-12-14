/**
 * Background Service Worker
 * Routes messages between content script and DevTools panel
 */

// Message router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source === 'ryunix-devtools') {
    // Forward to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message)
      }
    })
  }
  
  return true
})

// Log extension load
console.log('Ryunix DevTools extension loaded')
