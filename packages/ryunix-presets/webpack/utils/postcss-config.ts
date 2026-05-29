import fs from 'fs'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import type { AcceptedPlugin } from 'postcss'
import { resolveApp } from './index.js'

const CONFIG_CANDIDATES = [
  'postcss.config.js',
  'postcss.config.mjs',
  'postcss.config.cjs',
] as const

type PostcssConfigShape = {
  plugins?: AcceptedPlugin[] | Record<string, unknown>
}

function readPackageType(dir: string): 'module' | 'commonjs' {
  const pkgPath = resolveApp(dir, 'package.json')
  if (!fs.existsSync(pkgPath)) return 'commonjs'
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      type?: string
    }
    return pkg.type === 'module' ? 'module' : 'commonjs'
  } catch {
    return 'commonjs'
  }
}

function normalizeConfigExport(loaded: unknown): PostcssConfigShape | null {
  if (!loaded || typeof loaded !== 'object') return null
  const record = loaded as Record<string, unknown> & PostcssConfigShape
  if (
    'default' in record &&
    record.default &&
    typeof record.default === 'object'
  ) {
    return record.default as PostcssConfigShape
  }
  return record as PostcssConfigShape
}

function resolvePluginEntries(
  config: PostcssConfigShape,
  projectRequire: NodeRequire,
): AcceptedPlugin[] {
  const plugins = config.plugins
  if (!plugins) return []
  if (Array.isArray(plugins)) return plugins

  return Object.entries(plugins).map(([name, opts]) => {
    const pluginFn = projectRequire(name) as {
      default?: (...args: unknown[]) => AcceptedPlugin
    } & ((...args: unknown[]) => AcceptedPlugin)
    const fn = pluginFn.default || pluginFn
    return opts && typeof opts === 'object' && Object.keys(opts).length > 0
      ? fn(opts)
      : fn()
  })
}

async function loadConfigFile(
  configPath: string,
  fileName: string,
  packageType: 'module' | 'commonjs',
  projectRequire: NodeRequire,
): Promise<AcceptedPlugin[]> {
  let raw: unknown
  if (fileName.endsWith('.cjs')) {
    raw = projectRequire(configPath)
  } else if (
    fileName.endsWith('.mjs') ||
    (fileName.endsWith('.js') && packageType === 'module')
  ) {
    raw = await import(pathToFileURL(configPath).href)
  } else {
    raw = projectRequire(configPath)
  }

  const config = normalizeConfigExport(raw)
  if (!config) return []
  return resolvePluginEntries(config, projectRequire)
}

/**
 * Load PostCSS plugins from the user project.
 * Supports `postcss.config.js` (CJS or ESM per package.json `type`),
 * `postcss.config.mjs`, and `postcss.config.cjs`.
 */
export async function resolvePostcssPlugins(
  dir: string,
): Promise<AcceptedPlugin[]> {
  const projectRequire = createRequire(resolveApp(dir, 'package.json'))
  const packageType = readPackageType(dir)

  for (const name of CONFIG_CANDIDATES) {
    const configPath = resolveApp(dir, name)
    if (!fs.existsSync(configPath)) continue
    try {
      return await loadConfigFile(configPath, name, packageType, projectRequire)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.warn(`[Ryunix] Could not load ${name}: ${message}`)
    }
  }

  return []
}
