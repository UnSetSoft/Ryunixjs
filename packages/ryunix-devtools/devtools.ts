/**
 * Ryunix DevTools — main devtools page entry.
 */

;(function () {
  const ext = ((globalThis as { browser?: typeof chrome }).browser ??
    chrome) as typeof chrome

  ext.devtools.panels.create('Ryunix', '', 'panel.html', () => {
    console.log('Ryunix DevTools panel created')
  })
})()
