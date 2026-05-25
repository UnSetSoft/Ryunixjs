// @ts-nocheck
import fs from 'fs'
import { prerenderRoute } from './ssg.js'
import { resolveApp } from './index.js'
export async function renderDevRoute(req, res, devServer, dir, config) {
  // We only care about GET requests for HTML documents
  if (req.method !== 'GET' || !req.headers.accept?.includes('text/html')) {
    return false
  }
  // Find client compiler to read index.html from its memory file system
  const clientCompiler = devServer.compiler.compilers
    ? devServer.compiler.compilers.find((c) => c.name === 'client')
    : devServer.compiler
  if (!clientCompiler) return false
  const outputFs = clientCompiler.outputFileSystem
  const buildDir = config.buildDir
  const indexPath = resolveApp(dir, `${buildDir}/static/index.html`)
  let template
  try {
    template = outputFs.readFileSync(indexPath, 'utf-8')
  } catch (err) {
    // index.html not generated yet, let the dev server handle default logic
    return false
  }
  let AppRouterApp = null
  let ryunixRenderToString = null
  let ryunixCreateElement = null
  try {
    const serverBundleCandidates = [
      `${buildDir}/server/app-router-server.bundle.js`,
      `${buildDir}/server/app-router-server.bundle.mjs`,
    ].map((rel) => resolveApp(dir, rel))
    const serverBundlePath = serverBundleCandidates.find((p) =>
      fs.existsSync(p),
    )
    if (serverBundlePath) {
      if (typeof global.window === 'undefined') {
        global.window = { location: { pathname: req.url } }
      }
      if (typeof global.document === 'undefined') {
        global.document = {
          querySelector: () => null,
          getElementById: () => null,
        }
      }
      const serverModule = await import(
        `file://${serverBundlePath}?update=${Date.now()}`
      )
      AppRouterApp = serverModule.default?.default || serverModule.default
      const ryunixCore = await import('@unsetsoft/ryunixjs')
      const Ryunix = ryunixCore.default || ryunixCore
      global.Ryunix = Ryunix
      ryunixRenderToString = Ryunix.renderToString
      ryunixCreateElement = Ryunix.createElement
    }
  } catch (e) {
    console.warn(`[Ryunix SSR Dev] Failed to load server bundle: ${e.message}`)
    return false // fallback to SPA
  }
  let renderedString = ''
  if (AppRouterApp && ryunixRenderToString && ryunixCreateElement) {
    global.window = { location: { pathname: req.url } }
    try {
      const element = ryunixCreateElement(AppRouterApp)
      if (typeof global.Ryunix?.renderToStringAsync === 'function') {
        renderedString = await global.Ryunix.renderToStringAsync(element)
      } else {
        renderedString = ryunixRenderToString(element)
      }
    } catch (err) {
      console.error(`[Ryunix SSR Dev] Render error:`, err)
    }
  }
  // Generic mock route for prerenderRoute (to inject metadata)
  const ssrMetadata = global.Ryunix?.getState()?.ssrMetadata || {}
  if (config.debug)
    console.log('[Ryunix SSR Dev] Captured metadata:', ssrMetadata)
  const mockRoute = { path: req.url, meta: ssrMetadata }
  try {
    let html = await prerenderRoute(mockRoute, template, config, renderedString)
    // In dev mode with SSR, MiniCssExtractPlugin outputs CSS to the virtual filesystem.
    // We need to inject <link> tags for them so there is no FOUC.
    try {
      const cssDir = resolveApp(dir, `${buildDir}/static/css`)
      if (outputFs.existsSync(cssDir)) {
        const cssFiles = outputFs
          .readdirSync(cssDir)
          .filter((f) => f.endsWith('.css'))
        if (config.debug)
          console.log(
            `[Ryunix SSR Dev] Found CSS files: ${cssFiles.join(', ')}`,
          )
        const styleLinks = cssFiles
          .map((f) => `<link rel="stylesheet" href="/css/${f}" />`)
          .join('\n')
        if (styleLinks) {
          html = html.replace('</head>', `${styleLinks}\n</head>`)
        }
      }
    } catch (e) {
      // Ignore errors reading CSS directory
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(html)
    return true
  } catch (err) {
    console.error(`[Ryunix SSR Dev] Final render error:`, err)
    return false
  }
}
