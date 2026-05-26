import { createRequire } from 'module'
import * as fs from 'fs'
import * as path from 'path'

/** Map webpack.resolve.alias entries to TypeScript compilerOptions.paths. */
export function pathsFromRyunixConfig(
  projectDir: string,
): Record<string, string[]> {
  const cfgPath = path.join(projectDir, 'ryunix.config.js')
  if (!fs.existsSync(cfgPath)) return {}

  try {
    const req = createRequire(cfgPath)
    const loaded = req(cfgPath) as { default?: unknown } | unknown
    const config = (
      loaded && typeof loaded === 'object' && 'default' in loaded
        ? loaded.default
        : loaded
    ) as {
      webpack?: { resolve?: { alias?: Record<string, string> } }
    }

    const alias = config?.webpack?.resolve?.alias
    if (!alias || typeof alias !== 'object') return {}

    const paths: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(alias)) {
      if (typeof value !== 'string') continue
      const tsKey = key.endsWith('/*') ? key : `${key}/*`
      let rel = value.replace(/^\.\//, '')
      if (path.isAbsolute(value)) {
        rel = path.relative(projectDir, value).replace(/\\/g, '/')
        if (!rel || rel === '') rel = '.'
      }
      paths[tsKey] = [rel.endsWith('/*') ? rel : `${rel}/*`]
    }
    return paths
  } catch {
    return {}
  }
}

export function mergeCompilerPaths(
  base: Record<string, string[]>,
  extra: Record<string, string[]>,
): Record<string, string[]> {
  const merged = { ...base }
  for (const [key, value] of Object.entries(extra)) {
    if (merged[key]) continue
    merged[key] = value
  }
  return merged
}

/** True when jsconfig/tsconfig already defines a path prefix. */
export function hasPathPrefix(
  paths: Record<string, string[]>,
  prefix: string,
): boolean {
  const normalized = prefix.endsWith('/*') ? prefix : `${prefix}/*`
  return Object.keys(paths).some(
    (k) => k === prefix || k === normalized || k.startsWith(`${prefix}/`),
  )
}
