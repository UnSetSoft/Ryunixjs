import { vars } from '../utils/index'
import { scheduleWork } from './workers'

const clearContainer = (container) => {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
}

/**
 * Renders an element into a container using a work-in-progress (WIP) root.
 * @function render
 * @param {Object|HTMLElement} element - The element to be rendered in the container. It can be a Ryunix component (custom element) or a standard DOM element.
 * @param {HTMLElement} container - The container where the element will be rendered. This parameter is optional if `createRoot()` is used beforehand to set up the container.
 * @description The function assigns the `container` to a work-in-progress root and sets up properties for reconciliation, including children and the reference to the current root.
 * It also clears any scheduled deletions and establishes the next unit of work for incremental rendering.
 */
const render = (element, container) => {
  vars.wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: vars.currentRoot,
  }

  vars.nextUnitOfWork = vars.wipRoot
  vars.deletions = []
  scheduleWork(vars.wipRoot)
  return vars.wipRoot
}

/**
 * Initializes the application by creating a reference to a DOM element with the specified ID and rendering the main component.
 * @function init
 * @param {Object} MainElement - The main component to render, typically the root component of the application.
 * @param {string} [root='__ryunix'] - The ID of the HTML element that serves as the container for the root element. Defaults to `'__ryunix'` if not provided.
 * @example
 * Ryunix.init(App, "__ryunix"); // Initializes and renders the App component into the <div id="__ryunix"></div> element.
 * @description This function retrieves the container element by its ID and invokes the `render` function to render the main component into it.
 */
const init = (MainElement, root = '__ryunix') => {
  vars.containerRoot = document.getElementById(root)

  const renderProcess = render(MainElement, vars.containerRoot)

  return renderProcess
}

/**
 * Renders a Ryunix component tree to an HTML string (SSR/SSG), con soporte para obtención de datos.
 * Si el componente raíz exporta una función estática `fetchSSRData` o `fetchSSGData`, esta será ejecutada antes del renderizado
 * y sus datos serán inyectados como props.
 *
 * @param {Object} element - El elemento raíz a renderizar.
 * @param {Object} [options] - Contexto opcional para SSR/SSG (ej: route, params, props).
 * @returns {Promise<Object>} { html, head, data } - HTML renderizado, metadatos y datos obtenidos.
 *
 * Uso SSR con datos:
 *   App.fetchSSRData = async (ctx) => ({ user: await fetchUser(ctx.route) })
 *   const { html, head, data } = await renderToString(<App />, { route: '/about' })
 *
 * Uso SSG con datos:
 *   App.fetchSSGData = async (ctx) => ({ posts: await fetchPosts() })
 *   const { html, head, data } = await renderToString(<App />, { route: '/blog' })
 */
async function renderToString(element, options = {}) {
  // Soporte para obtención de datos SSR/SSG
  let data = undefined;
  let rootType = element && element.type;
  // Si no se pasa location en ssrContext, usar '/'
  if (options && !options.location) {
    options.location = '/';
  }
  if (rootType && typeof rootType === 'function') {
    if (typeof rootType.fetchSSRData === 'function' && options.ssr !== false) {
      data = await rootType.fetchSSRData(options)
    } else if (typeof rootType.fetchSSGData === 'function' && options.ssg !== false) {
      data = await rootType.fetchSSGData(options)
    }
  }
  // Inyectar los datos como props
  if (data) {
    element = { ...element, props: { ...element.props, ...data } }
  }
  // Temporary global context for SSR/SSG metadata collection
  const ssrContext = { head: [] };
  const prevContext = globalThis.__RYUNIX_SSR_CONTEXT__;
  globalThis.__RYUNIX_SSR_CONTEXT__ = ssrContext;

  function renderNode(node) {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node)
    }
    if (!node || typeof node !== 'object') return ''
    if (node.type === 'FRAGMENT' || node.type === undefined) {
      return (Array.isArray(node.children) ? node.children : [node.children])
        .map(renderNode)
        .join('')
    }
    if (typeof node.type === 'function') {
      const rendered = node.type({ ...node.props, ...options })
      return renderNode(rendered)
    }
    let html = `<${node.type}`
    if (node.props) {
      for (const [key, value] of Object.entries(node.props)) {
        if (key === 'children' || value == null || typeof value === 'object') continue
        html += ` ${key}="${String(value)}"`
      }
    }
    html += '>'
    if (node.props && node.props.children) {
      html += (Array.isArray(node.props.children)
        ? node.props.children.map(renderNode).join('')
        : renderNode(node.props.children))
    }
    html += `</${node.type}>`
    return html
  }

  const html = renderNode(element)
  // Restore previous context to avoid leaking between renders
  globalThis.__RYUNIX_SSR_CONTEXT__ = prevContext;
  return { html, head: ssrContext.head.join('\n'), data }
}

/**
 * Helper para asociar una función de obtención de datos SSR a un componente Ryunix.
 * @param {Function} Component - Componente Ryunix.
 * @param {Function} fetchFn - Función async (ctx) => datos.
 * @returns {Function} El mismo componente, con fetchSSRData asignado.
 * @example
 *   export default withSSRData(App, async (ctx) => ({ user: await fetchUser(ctx.route) }))
 */
function withSSRData(Component, fetchFn) {
  Component.fetchSSRData = fetchFn;
  return Component;
}

/**
 * Helper para asociar una función de obtención de datos SSG a un componente Ryunix.
 * @param {Function} Component - Componente Ryunix.
 * @param {Function} fetchFn - Función async (ctx) => datos.
 * @returns {Function} El mismo componente, con fetchSSGData asignado.
 * @example
 *   export default withSSGData(App, async (ctx) => ({ posts: await fetchPosts() }))
 */
function withSSGData(Component, fetchFn) {
  Component.fetchSSGData = fetchFn;
  return Component;
}

/**
 * Hidrata una aplicación Ryunix renderizada por SSR/SSG, enlazando eventos y estado sobre el DOM existente.
 * @function hydrate
 * @param {Object|HTMLElement} element - El elemento raíz a hidratar.
 * @param {string|HTMLElement} [root='__ryunix'] - El contenedor raíz (id o elemento DOM).
 * @description Busca el contenedor en el DOM y reutiliza el HTML existente, enlazando el árbol de componentes Ryunix.
 * @example
 *   // En el cliente, tras recibir HTML SSR/SSG:
 *   import { hydrate } from 'ryunix';
 *   hydrate(<App />, '__ryunix');
 */
function hydrate(MainElement, root = '__ryunix') {
  let container = typeof root === 'string' ? document.getElementById(root) : root;
  if (!container) throw new Error('No se encontró el contenedor para hidratar');
  // Reutiliza el DOM existente y conecta el árbol Ryunix
  // (En este ejemplo, simplemente delegamos a render, pero en el futuro se puede optimizar para diff/hidratación real)
  return render(MainElement, container);
}

/**
 * Universal RyunixJS rendering API: SPA, SSR, SSG e Hidratación
 *
 * - `render`: Renderiza en el DOM (SPA).
 * - `init`: Inicializa la app en modo SPA.
 * - `hydrate`: Hidrata el DOM generado por SSR/SSG en el cliente.
 * - `renderToString`: Renderiza a string HTML para SSR/SSG, recolectando metadatos y soportando obtención de datos.
 * - `withSSRData`: Helper para asociar fetchSSRData a un componente.
 * - `withSSGData`: Helper para asociar fetchSSGData a un componente.
 *
 * Nota:
 *   En SSR/SSG, si no se indica la ruta actual, el router usará '/' por defecto.
 *   Es recomendable pasar la ruta deseada mediante ssrContext/location para renderizar la página correcta.
 *
 * Ejemplo SPA:
 *   import { render, init } from 'ryunix';
 *   init(<App />);
 *
 * Ejemplo SSR con hidratación:
 *   // En el servidor:
 *   const { html, head } = await renderToString(<App />); // Renderiza '/'
 *   // o para una ruta específica:
 *   const { html, head } = await renderToString(
 *     <RouterProvider routes={routes} ssrContext={{ location: '/about' }}>
 *       <App />
 *     </RouterProvider>
 *   );
 *   // ...enviar html y head al cliente...
 *   // En el cliente:
 *   import { hydrate } from 'ryunix';
 *   hydrate(<App />, '__ryunix');
 *
 * Ejemplo SSG con hidratación:
 *   // Igual que SSR, pero con rutas estáticas
 */
export { render, init, hydrate, renderToString, withSSRData, withSSGData }
