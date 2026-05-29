import fs from 'fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Compiler } from 'webpack'
import { prerenderRoute } from './ssg.js'
import { resolveApp } from './index.js'

interface MemoryOutputFileSystem {
  readFileSync: (path: string, encoding: string) => string
  existsSync: (path: string) => boolean
  readdirSync: (path: string) => string[]
}

interface DevServerLike {
  compiler: Compiler & {
    compilers?: Compiler[]
  }
}

declare global {
  var Ryunix:
    | {
        renderToString?: (element: unknown) => string
        renderToStringAsync?: (element: unknown) => Promise<string>
        createElement?: (component: unknown) => unknown
        getState?: () => { ssrMetadata?: Record<string, unknown> }
      }
    | undefined
}

export async function renderDevRoute(
  req: IncomingMessage,
  res: ServerResponse,
  devServer: DevServerLike,
  dir: string,
  config: Record<string, unknown>,
): Promise<boolean> {
  if (req.method !== 'GET' || !req.headers.accept?.includes('text/html')) {
    return false
  }

  const clientCompiler = devServer.compiler.compilers
    ? devServer.compiler.compilers.find((c) => c.name === 'client')
    : devServer.compiler

  if (!clientCompiler) return false

  const outputFs =
    clientCompiler.outputFileSystem as unknown as MemoryOutputFileSystem
  if (
    !outputFs?.readFileSync ||
    !outputFs.existsSync ||
    !outputFs.readdirSync
  ) {
    return false
  }

  const buildDir = String(config.buildDir)
  const indexPath = resolveApp(dir, `${buildDir}/static/index.html`)

  let template: string
  try {
    template = outputFs.readFileSync(indexPath, 'utf-8')
  } catch {
    return false
  }

  const previousWindow = global.window
  const previousDocument = global.document
  const previousRyunix = global.Ryunix

  let AppRouterApp: unknown = null
  let ryunixRenderToString: ((element: unknown) => string) | null = null
  let ryunixCreateElement: ((component: unknown) => unknown) | null = null

  try {
    const serverBundleCandidates = [
      `${buildDir}/server/app-router-server.bundle.js`,
      `${buildDir}/server/app-router-server.bundle.mjs`,
    ].map((rel) => resolveApp(dir, rel))
    const serverBundlePath = serverBundleCandidates.find((p) =>
      fs.existsSync(p),
    )
    if (serverBundlePath) {
      global.window = {
        location: { pathname: req.url ?? '/' },
      } as Window & typeof globalThis
      global.document = {
        querySelector: () => null,
        getElementById: () => null,
      } as unknown as Document

      const serverModule = await import(
        `file://${serverBundlePath}?update=${Date.now()}`
      )
      AppRouterApp = serverModule.default?.default || serverModule.default

      const ryunixCore = await import('@unsetsoft/ryunixjs')
      const Ryunix = ryunixCore.default || ryunixCore
      global.Ryunix = Ryunix as typeof global.Ryunix
      ryunixRenderToString = Ryunix.renderToString as (
        element: unknown,
      ) => string
      ryunixCreateElement = Ryunix.createElement as (
        component: unknown,
      ) => unknown
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    console.warn(`[Ryunix SSR Dev] Failed to load server bundle: ${message}`)
    return false
  }

  let renderedString = ''
  let renderFailed = false

  if (AppRouterApp && ryunixRenderToString && ryunixCreateElement) {
    global.window = {
      location: { pathname: req.url ?? '/' },
    } as Window & typeof globalThis
    try {
      const element = ryunixCreateElement(AppRouterApp)
      if (typeof global.Ryunix?.renderToStringAsync === 'function') {
        renderedString = await global.Ryunix.renderToStringAsync(element)
      } else {
        renderedString = ryunixRenderToString(element)
      }
    } catch (err) {
      renderFailed = true
      console.error(`[Ryunix SSR Dev] Render error:`, err)
    }
  }

  if (renderFailed) {
    return false
  }

  const ssrMetadata = globalThis.Ryunix?.getState?.()?.ssrMetadata || {}
  if (config.debug)
    console.log('[Ryunix SSR Dev] Captured metadata:', ssrMetadata)
  const mockRoute = { path: req.url ?? '/', meta: ssrMetadata }

  try {
    let html = await prerenderRoute(mockRoute, template, config, renderedString)

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
    } catch {
      // Ignore errors reading CSS directory
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(html)
    return true
  } catch (err) {
    console.error(`[Ryunix SSR Dev] Final render error:`, err)
    return false
  } finally {
    if (previousWindow === undefined) {
      delete (global as { window?: unknown }).window
    } else {
      global.window = previousWindow
    }
    if (previousDocument === undefined) {
      delete (global as { document?: unknown }).document
    } else {
      global.document = previousDocument
    }
    if (previousRyunix === undefined) {
      delete (global as { Ryunix?: unknown }).Ryunix
    } else {
      global.Ryunix = previousRyunix
    }
  }
}
