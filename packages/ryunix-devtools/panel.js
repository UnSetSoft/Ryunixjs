/**
 * Ryunix DevTools Panel
 */

const statusEl = document.getElementById('status')
const tree = document.getElementById('tree')
const details = document.getElementById('details')

let fibers = []
let selected = null
let stats = { total: 0, renders: 0, times: [] }

// Tab switching
document.querySelectorAll('.tab').forEach((tab) => {
  tab.onclick = () => {
    document
      .querySelectorAll('.tab, .tab-panel')
      .forEach((el) => el.classList.remove('active'))
    tab.classList.add('active')
    document.getElementById(tab.dataset.tab).classList.add('active')
  }
})

// Listen for messages
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.source !== 'ryunix-devtools') return

  const { event, data } = msg.payload

  if (event === 'ready') {
    statusEl.textContent = '✅ Connected to Ryunix'
    statusEl.classList.add('connected')
  } else if (event === 'fiber') {
    fibers.push(data)
    stats.total = fibers.length
    renderTree()
  } else if (event === 'render') {
    stats.renders++
    stats.times.push(data.duration)
    updatePerformance()
  }
})

function renderTree() {
  if (fibers.length === 0) return

  tree.innerHTML = fibers
    .map(
      (f, i) =>
        `<div class="tree-item" data-index="${i}">
      <span class="component-name">&lt;${f.type}/&gt;</span>
      ${f.hooks > 0 ? `<span class="hook-badge">${f.hooks}</span>` : ''}
    </div>`,
    )
    .join('')

  tree.querySelectorAll('.tree-item').forEach((el) => {
    el.onclick = () => selectFiber(parseInt(el.dataset.index))
  })
}

function selectFiber(index) {
  selected = fibers[index]

  tree
    .querySelectorAll('.tree-item')
    .forEach((el, i) => el.classList.toggle('selected', i === index))

  // Props
  const props = Object.entries(selected.props)
  details.innerHTML = `
    <div class="section-header">Props</div>
    ${
      props.length > 0
        ? props
            .map(
              ([k, v]) =>
                `<div class="prop-row">
            <span class="prop-key">${k}:</span>
            <span class="prop-value">${v}</span>
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
  document.getElementById('total-components').textContent = stats.total
  document.getElementById('total-renders').textContent = stats.renders

  if (stats.times.length > 0) {
    const avg = stats.times.reduce((a, b) => a + b, 0) / stats.times.length
    document.getElementById('avg-time').textContent = avg.toFixed(1) + 'ms'
  }

  // Slow components
  const slow = fibers.filter((f) => f.renderTime > 16)
  const slowList = document.getElementById('slow-list')

  if (slow.length > 0) {
    slowList.innerHTML = slow
      .map(
        (f) =>
          `<div class="slow-component">
        <div class="slow-component-name">&lt;${f.type}/&gt;</div>
        <div class="slow-component-time">${f.renderTime.toFixed(2)}ms</div>
      </div>`,
      )
      .join('')
  } else {
    slowList.innerHTML =
      '<div style="color: #999; padding: 1rem 0;">No slow components detected</div>'
  }
}
