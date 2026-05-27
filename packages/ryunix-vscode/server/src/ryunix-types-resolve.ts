import * as fs from 'fs'
import * as path from 'path'

const RYUNIX_PKG = '@unsetsoft/ryunixjs'

function readPackageName(pkgPath: string): string | undefined {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      name?: string
    }
    return pkg.name
  } catch {
    return undefined
  }
}

/** Absolute path to `types/index.d.ts` for @unsetsoft/ryunixjs (node_modules or monorepo core). */
export function resolveRyunixTypesEntry(
  projectRoot: string,
): string | undefined {
  const searchRoots = new Set<string>()
  let dir = path.resolve(projectRoot)

  for (let i = 0; i < 10; i++) {
    searchRoots.add(dir)
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  for (const root of searchRoots) {
    const fromNodeModules = path.join(
      root,
      'node_modules',
      RYUNIX_PKG,
      'types',
      'index.d.ts',
    )
    if (fs.existsSync(fromNodeModules)) return fromNodeModules

    const corePkg = path.join(root, 'packages', 'core', 'package.json')
    const coreTypes = path.join(root, 'packages', 'core', 'types', 'index.d.ts')
    if (fs.existsSync(coreTypes) && readPackageName(corePkg) === RYUNIX_PKG) {
      return coreTypes
    }
  }

  return undefined
}

/** compilerOptions.paths entry relative to projectRoot baseUrl. */
export function ryunixTypesPathEntries(
  projectRoot: string,
): string[] | undefined {
  const entry = resolveRyunixTypesEntry(projectRoot)
  if (!entry) return undefined

  const rel = path
    .relative(path.resolve(projectRoot), entry)
    .replace(/\\/g, '/')
  if (!rel || rel.startsWith('/')) return undefined
  return [rel.startsWith('.') ? rel : `./${rel}`]
}
