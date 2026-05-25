/**
 * Ryunix DevTools — main devtools page entry.
 */
chrome.devtools.panels.create(
  'Ryunix',
  'icons/icon48.png',
  'panel.html',
  () => {
    console.log('Ryunix DevTools panel created')
  },
)
