/**
 * Ryunix DevTools Panel UI.
 */

;(function () {
  const ext = ((globalThis as { browser?: typeof chrome }).browser ??
    chrome) as typeof chrome

  interface PanelFiber {
    type: string
    props: Record<string, unknown>
    hooks: number
    renderTime?: number
  }

  interface RenderEventData {
    duration: number
  }

  function requireElement(id: string): HTMLElement {
    const el = document.getElementById(id)
    if (!el) {
      throw new Error(`Ryunix DevTools panel markup is missing #${id}`)
    }
    return el
  }

  const statusEl = requireElement('status')
  const treeEl = requireElement('tree')
  const detailsEl = requireElement('details')

  const fibers: PanelFiber[] = []
  let selected: PanelFiber | null = null
  const stats = { total: 0, renders: 0, times: [] as number[] }

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabEl = tab as HTMLElement
      document
        .querySelectorAll('.tab, .tab-panel')
        .forEach((el) => el.classList.remove('active'))
      tabEl.classList.add('active')
      const panel = document.getElementById(tabEl.dataset.tab ?? '')
      panel?.classList.add('active')
    })
  })

  ext.runtime.onMessage.addListener((msg) => {
    if (msg.source !== 'ryunix-devtools' || !msg.payload) return

    const { event, data } = msg.payload

    if (event === 'ready') {
      statusEl.textContent = '\u2705 Connected to Ryunix'
      statusEl.classList.add('connected')
    } else if (event === 'fiber' && data && typeof data === 'object') {
      fibers.push(data as PanelFiber)
      stats.total = fibers.length
      renderTree()
    } else if (event === 'render' && data && typeof data === 'object') {
      const renderData = data as RenderEventData
      stats.renders++
      stats.times.push(renderData.duration)
      updatePerformance()
    }
  })

  function renderTree(): void {
    if (fibers.length === 0) return

    treeEl.textContent = ''

    fibers.forEach((f, i) => {
      const item = document.createElement('div')
      item.className = 'tree-item'
      item.dataset.index = String(i)

      const name = document.createElement('span')
      name.className = 'component-name'

      name.textContent = `<${f.type}/>`
      item.appendChild(name)

      if (f.hooks > 0) {
        const badge = document.createElement('span')
        badge.className = 'hook-badge'
        badge.textContent = String(f.hooks)
        item.appendChild(badge)
      }

      item.addEventListener('click', () => selectFiber(i))
      treeEl.appendChild(item)
    })
  }

  function selectFiber(index: number): void {
    selected = fibers[index] ?? null
    if (!selected) return

    treeEl.querySelectorAll('.tree-item').forEach((el, i) => {
      el.classList.toggle('selected', i === index)
    })

    detailsEl.textContent = ''

    const header = document.createElement('div')
    header.className = 'section-header'
    header.textContent = 'Props'
    detailsEl.appendChild(header)

    const props = Object.entries(selected.props)
    if (props.length > 0) {
      props.forEach(([k, v]) => {
        const row = document.createElement('div')
        row.className = 'prop-row'
        const keySpan = document.createElement('span')
        keySpan.className = 'prop-key'
        keySpan.textContent = `${k}:`
        const valSpan = document.createElement('span')
        valSpan.className = 'prop-value'
        valSpan.textContent = String(v)
        row.appendChild(keySpan)
        row.appendChild(valSpan)
        detailsEl.appendChild(row)
      })
    } else {
      const empty = document.createElement('div')
      empty.style.cssText = 'color: #999; padding: 1rem 0;'
      empty.textContent = 'No props'
      detailsEl.appendChild(empty)
    }
  }

  function updatePerformance(): void {
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

    slowList.textContent = ''

    if (slow.length > 0) {
      slow.forEach((f) => {
        const wrapper = document.createElement('div')
        wrapper.className = 'slow-component'

        const name = document.createElement('div')
        name.className = 'slow-component-name'
        name.textContent = `<${f.type}/>`

        const time = document.createElement('div')
        time.className = 'slow-component-time'
        time.textContent = `${(f.renderTime ?? 0).toFixed(2)}ms`

        wrapper.appendChild(name)
        wrapper.appendChild(time)
        slowList.appendChild(wrapper)
      })
    } else {
      const msg = document.createElement('div')
      msg.style.cssText = 'color: #999; padding: 1rem 0;'
      msg.textContent = 'No slow components detected'
      slowList.appendChild(msg)
    }
  }
})()
