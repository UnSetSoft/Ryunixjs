/**
 * Ryunix DevTools Panel UI.
 */
const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return String(unsafe)
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
const statusEl = document.getElementById('status')
const tree = document.getElementById('tree')
const details = document.getElementById('details')
if (!statusEl || !tree || !details) {
  throw new Error('Ryunix DevTools panel markup is missing required elements')
}
const fibers = []
let selected = null
const stats = { total: 0, renders: 0, times: [] }
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const tabEl = tab
    document
      .querySelectorAll('.tab, .tab-panel')
      .forEach((el) => el.classList.remove('active'))
    tabEl.classList.add('active')
    const panel = document.getElementById(tabEl.dataset.tab ?? '')
    panel?.classList.add('active')
  })
})
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.source !== 'ryunix-devtools' || !msg.payload) return
  const { event, data } = msg.payload
  if (event === 'ready') {
    statusEl.textContent = '\u2705 Connected to Ryunix'
    statusEl.classList.add('connected')
  } else if (event === 'fiber' && data && typeof data === 'object') {
    fibers.push(data)
    stats.total = fibers.length
    renderTree()
  } else if (event === 'render' && data && typeof data === 'object') {
    const renderData = data
    stats.renders++
    stats.times.push(renderData.duration)
    updatePerformance()
  }
})
function renderTree() {
  if (fibers.length === 0) return
  tree.innerHTML = fibers
    .map(
      (f, i) => `<div class="tree-item" data-index="${i}">
      <span class="component-name">&lt;${escapeHtml(f.type)}/&gt;</span>
      ${f.hooks > 0 ? `<span class="hook-badge">${f.hooks}</span>` : ''}
    </div>`,
    )
    .join('')
  tree.querySelectorAll('.tree-item').forEach((el) => {
    el.addEventListener('click', () => {
      const index = parseInt(el.dataset.index ?? '-1', 10)
      if (index >= 0) selectFiber(index)
    })
  })
}
function selectFiber(index) {
  selected = fibers[index] ?? null
  if (!selected) return
  tree.querySelectorAll('.tree-item').forEach((el, i) => {
    el.classList.toggle('selected', i === index)
  })
  const props = Object.entries(selected.props)
  details.innerHTML = `
    <div class="section-header">Props</div>
    ${
      props.length > 0
        ? props
            .map(
              ([k, v]) => `<div class="prop-row">
            <span class="prop-key">${escapeHtml(k)}:</span>
            <span class="prop-value">${escapeHtml(v)}</span>
          </div>`,
            )
            .join('')
        : '<div style="color: #999; padding: 1rem 0;">No props</div>'
    }
    <div class="section-header">Hooks</div>
    <div style="padding: 1rem 0;">${selected.hooks || 0} hooks</div>
  `
}
function updatePerformance() {
  const totalComponents = document.getElementById('total-components')
  const totalRenders = document.getElementById('total-renders')
  const avgTime = document.getElementById('avg-time')
  const slowList = document.getElementById('slow-list')
  if (!totalComponents || !totalRenders || !avgTime || !slowList) return
  totalComponents.textContent = String(stats.total)
  totalRenders.textContent = String(stats.renders)
  if (stats.times.length > 0) {
    const avg = stats.times.reduce((a, b) => a + b, 0) / stats.times.length
    avgTime.textContent = avg.toFixed(1) + 'ms'
  }
  const slow = fibers.filter((f) => (f.renderTime ?? 0) > 16)
  if (slow.length > 0) {
    slowList.innerHTML = slow
      .map(
        (f) => `<div class="slow-component">
        <div class="slow-component-name">&lt;${escapeHtml(f.type)}/&gt;</div>
        <div class="slow-component-time">${(f.renderTime ?? 0).toFixed(2)}ms</div>
      </div>`,
      )
      .join('')
  } else {
    slowList.innerHTML =
      '<div style="color: #999; padding: 1rem 0;">No slow components detected</div>'
  }
}
