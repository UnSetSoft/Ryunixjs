import {
  escapeHtml,
  renderToString,
  renderToStringAsync,
} from '../lib/server/ssr.js'
import { createElement } from '../lib/reconciler/createElement.js'
import { createContext, useMetadata } from '../lib/hooks/hooks.js'
import {
  mergeRouteMetadata,
  resolvePageMetadata,
} from '../lib/hooks/metadata.js'
import { getState } from '../utils/index.js'

describe('escapeHtml', () => {
  test('escapes HTML special characters', () => {
    expect(escapeHtml('<script>"\'&</script>')).toBe(
      '&lt;script&gt;&quot;&#039;&amp;&lt;/script&gt;',
    )
  })
})

describe('renderToString', () => {
  test('renders host elements and text', () => {
    const tree = createElement('div', { className: 'box' }, 'Hello')
    expect(renderToString(tree)).toBe('<div class="box">Hello</div>')
  })

  test('renders void elements with self-closing tags', () => {
    const tree = createElement('img', { src: '/logo.png', alt: 'Logo' })
    expect(renderToString(tree)).toBe('<img src="/logo.png" alt="Logo" />')
  })

  test('rejects async components', () => {
    const AsyncPage = async () => createElement('div', null, 'Late')
    expect(() => renderToString(createElement(AsyncPage))).toThrow(
      /renderToStringAsync/,
    )
  })

  test('supports context during SSR', () => {
    const { Provider, useContext } = createContext('guest')
    const Page = () => {
      const user = useContext()
      return createElement('span', null, String(user))
    }
    const tree = createElement(
      Provider,
      { value: 'admin' },
      createElement(Page),
    )
    expect(renderToString(tree)).toBe('<span>admin</span>')
  })
})

describe('renderToStringAsync', () => {
  test('renders async components', async () => {
    const AsyncPage = async () => createElement('p', null, 'Streamed')
    const html = await renderToStringAsync(createElement(AsyncPage))
    expect(html).toContain('<p>Streamed</p>')
  })

  test('renders void elements in stream path', async () => {
    const tree = createElement('br', null)
    const html = await renderToStringAsync(tree)
    expect(html).toContain('<br />')
    expect(html).not.toContain('</br>')
  })

  test('closes script tags when using dangerouslySetInnerHTML', async () => {
    const tree = createElement('script', {
      dangerouslySetInnerHTML: { __html: 'window.__boot = true;' },
    })
    const html = await renderToStringAsync(tree)
    expect(html).toContain('<script>window.__boot = true;</script>')
    expect(html).not.toContain('<undefined>')
  })
})

describe('SSR metadata helpers', () => {
  test('mergeRouteMetadata preserves layout title template', () => {
    const merged = mergeRouteMetadata(
      { title: { default: 'App', template: '%s | App' } },
      { title: 'Docs' },
    )
    expect(merged.title).toBe('Docs')
    expect(merged.titleTemplate).toBe('%s | App')
    expect(merged.titleDefault).toBe('App')
  })

  test('resolvePageMetadata applies title template', () => {
    const resolved = resolvePageMetadata({
      titleTemplate: '%s | Ryunix',
      titleDefault: 'Ryunix',
      pageTitle: 'About',
      description: 'About page',
    })
    expect(resolved.title).toBe('About | Ryunix')
    expect(resolved.tags.description).toBe('About page')
  })

  test('useMetadata merges into ssrMetadata during renderToString', () => {
    const Layout = ({ children }) => {
      useMetadata({
        title: { default: 'App', template: '%s | App' },
        description: 'Root layout',
      })
      return children
    }
    const Page = () => {
      useMetadata({ title: 'Docs' })
      return createElement('main', null, 'Content')
    }
    renderToString(createElement(Layout, null, createElement(Page)))
    const meta = getState().ssrMetadata || {}
    const resolved = resolvePageMetadata(meta)
    expect(resolved.title).toBe('Docs | App')
    expect(resolved.tags.description).toBe('Root layout')
  })
})
