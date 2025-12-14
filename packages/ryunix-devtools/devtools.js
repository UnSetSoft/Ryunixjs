/**
 * Ryunix DevTools - Main entry
 */

chrome.devtools.panels.create(
  'Ryunix',
  'icons/icon48.png',
  'panel.html',
  (panel) => {
    console.log('Ryunix DevTools panel created')
  }
)
