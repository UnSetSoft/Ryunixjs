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

  const escapeHtml = (unsafe: unknown): string => {
    if (typeof unsafe !== 'string') return String(unsafe)
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
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

    treeEl.innerHTML = fibers
      .map(
        (f, i) =>
          `<div class="tree-item" data-index="${i}">
      <span class="component-name">&lt;${escapeHtml(f.type)}/&gt;</span>
      ${f.hooks > 0 ? `<span class="hook-badge">${f.hooks}</span>` : ''}
    </div>`,
      )
      .join('')

    treeEl.querySelectorAll('.tree-item').forEach((el) => {
      el.addEventListener('click', () => {
        const index = parseInt((el as HTMLElement).dataset.index ?? '-1', 10)
        if (index >= 0) selectFiber(index)
      })
    })
  }

  function selectFiber(index: number): void {
    selected = fibers[index] ?? null
    if (!selected) return

    treeEl.querySelectorAll('.tree-item').forEach((el, i) => {
      el.classList.toggle('selected', i === index)
    })

    const props = Object.entries(selected.props)
    detailsEl.innerHTML = `
    <div class="section-header">Props</div>
    ${
      props.length > 0
        ? props
            .map(
              ([k, v]) =>
                `<div class="prop-row">
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

    if (slow.length > 0) {
      slowList.innerHTML = slow
        .map(
          (f) =>
            `<div class="slow-component">
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
})()
