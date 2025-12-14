/**
 * DevTools Panel Logic
 */

const tree = document.getElementById('tree')
const propsEl = document.getElementById('props')
const hooksEl = document.getElementById('hooks')
const statusEl = document.getElementById('status')

let fibers = []
let selected = null

// Listen for messages from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.source !== 'ryunix-devtools') return
  
  const { event, data } = msg.payload
  
  switch (event) {
    case 'ready':
      statusEl.textContent = '✅ Conectado a Ryunix v' + (data.version || '1.3.0')
      statusEl.style.background = '#d4edda'
      statusEl.style.borderColor = '#28a745'
      setTimeout(() => statusEl.style.display = 'none', 3000)
      break
      
    case 'fiber':
      fibers.push(data)
      renderTree()
      break
      
    case 'init':
      fibers = []
      renderTree()
      break
  }
})

/**
 * Render component tree
 */
function renderTree() {
  if (fibers.length === 0) {
    tree.innerHTML = '<div class="empty">No hay componentes</div>'
    return
  }
  
  tree.innerHTML = fibers.map((fiber, i) => 
    `<div class="fiber" data-index="${i}">
      <div class="fiber-type">${fiber.type}</div>
      ${fiber.hooks > 0 ? `<div class="fiber-hooks">${fiber.hooks} hooks</div>` : ''}
    </div>`
  ).join('')
  
  tree.querySelectorAll('.fiber').forEach(el => {
    el.onclick = () => selectFiber(parseInt(el.dataset.index))
  })
}

/**
 * Select fiber and show details
 */
function selectFiber(index) {
  selected = fibers[index]
  
  document.querySelectorAll('.fiber').forEach((el, i) => {
    el.classList.toggle('selected', i === index)
  })
  
  // Show props
  if (Object.keys(selected.props).length > 0) {
    propsEl.textContent = JSON.stringify(selected.props, null, 2)
    propsEl.classList.remove('empty')
  } else {
    propsEl.textContent = 'Sin props'
    propsEl.classList.add('empty')
  }
  
  // Show hooks
  if (selected.hooks > 0) {
    hooksEl.textContent = `Total: ${selected.hooks} hooks`
    hooksEl.classList.remove('empty')
  } else {
    hooksEl.textContent = 'Sin hooks'
    hooksEl.classList.add('empty')
  }
}

// Initial render
renderTree()
