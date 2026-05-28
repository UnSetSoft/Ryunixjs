/**
 * Automatic Prerender - reads routes from manifest
 */
import { buildSSG } from '../utils/ssg.js'
import { configFileExist } from '../utils/settingfile.js'
import defaultSettings from '../utils/config.js'
import { resolveApp } from '../utils/index.js'
import fs from 'fs'
import path from 'path'

interface SsgRoute {
  path: string
  meta?: Record<string, unknown>
}

const loadResolvedSSGRoutes = async (
  buildDirectory: string,
): Promise<SsgRoute[] | null> => {
  const serverBundleCandidates = [
    path.join(buildDirectory, 'server', 'app-router-server.bundle.js'),
    path.join(buildDirectory, 'server', 'app-router-server.bundle.mjs'),
  ]
  const serverBundlePath = serverBundleCandidates.find((candidate) =>
    fs.existsSync(candidate),
  )

  if (!serverBundlePath) return null

  try {
    const serverModule = await import(
      `file://${serverBundlePath}?update=${Date.now()}`
    )
    if (typeof serverModule.resolveSSGPaths === 'function') {
      return await serverModule.resolveSSGPaths()
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(
      '[SSG] Could not resolve dynamic routes from server bundle:',
      message,
    )
  }

  return null
}

const normalizeManifestRoutes = (routes: SsgRoute[]): SsgRoute[] =>
  routes
    .filter((route) => route && route.path && !route.path.includes(':'))
    .map((route) => ({
      path: route.path,
      meta: route.meta || {},
    }))

const Prerender = async (directory: string) => {
  const buildDirectory = resolveApp(process.cwd(), directory)

  if (!configFileExist()) {
    console.error('❌ No configuration file found.')
    process.exit(1)
  }

  const manifestPath = path.join(
    process.cwd(),
    directory,
    'cache/ssg',
    'routes.json',
  )
  let routes: SsgRoute[] = []

  if (fs.existsSync(manifestPath)) {
    try {
      routes = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      console.error('[SSG] Error reading routes manifest:', error)
    }
  }

  const resolvedRoutes = await loadResolvedSSGRoutes(buildDirectory)
  if (resolvedRoutes) {
    routes = resolvedRoutes
    if (defaultSettings.debug) {
      console.log(
        `[SSG] Resolved ${routes.length} routes via generateStaticParams`,
      )
    }
  } else {
    routes = normalizeManifestRoutes(routes)
  }

  const metaExist = routes.some((route) => route.meta)
  if (
    metaExist &&
    Object.keys(defaultSettings.legacy?.seo?.meta || {}).length > 0
  ) {
    console.error(
      '[Ryunix Error] You are mixing static and dynamic meta tags; you can only use one of the two. Remove legacy.seo.meta from ryunix.config.js.',
    )
    process.exit(1)
  }

  if (routes.length === 0) {
    const legacyRoutes = defaultSettings.legacy?.ssg?.prerender || []
    routes = legacyRoutes.map((route) =>
      typeof route === 'string' ? { path: route, meta: {} } : route,
    )
    if (routes.length > 0) {
      console.log(`[SSG] Using ${routes.length} routes from config`)
    }
  }

  if (routes.length === 0) {
    console.log('[SSG] No routes to prerender, skipping SSG generation.')
    return
  }

  try {
    await buildSSG(
      routes,
      defaultSettings as Parameters<typeof buildSSG>[1],
      buildDirectory,
      defaultSettings.debug,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
  console.log('✅ SSG build complete')
}

export default Prerender
