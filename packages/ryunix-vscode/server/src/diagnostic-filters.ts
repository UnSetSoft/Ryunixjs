import * as fs from 'fs'
import * as path from 'path'
import ts from 'typescript'

/** Webpack asset imports handled by file-loader / asset modules. */
const ASSET_MODULE =
  /\.(svg|png|jpe?g|gif|webp|ico|avif|bmp|mp4|webm|woff2?|ttf|eot|mp3|wav|css|scss|sass|less)(\?.*)?$/i

/** Ryunix / webpack script resolution order (see ryunix-presets webpack.config). */
const RESOLVE_EXTENSIONS = [
  '.ryx',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
]

const MODULE_NOT_FOUND = 2307

function normalizePath(filePath: string): string {
  try {
    return fs.realpathSync.native(path.resolve(filePath))
  } catch {
    return path.resolve(filePath)
  }
}

function flattenMessage(message: ts.DiagnosticMessageChain | string): string {
  if (typeof message === 'string') return message
  let out = message.messageText
  for (const next of message.next ?? []) {
    out += flattenMessage(next)
  }
  return out
}

function moduleSpecifierFromDiagnostic(d: ts.Diagnostic): string | undefined {
  if (d.code !== MODULE_NOT_FOUND) return undefined
  const text = flattenMessage(d.messageText)
  const quoted = text.match(/Cannot find module '([^']+)'/)
  if (quoted) return quoted[1]
  const unquoted = text.match(/Cannot find module ([^\s]+)/)
  return unquoted?.[1]
}

function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

/** Match webpack resolve: explicit path, extension suffix, or directory/index.* */
function tryResolveFile(candidate: string): string | undefined {
  const normalized = normalizePath(candidate)
  if (isExistingFile(normalized)) return normalized

  const ext = path.extname(normalized)
  if (!ext) {
    for (const suffix of RESOLVE_EXTENSIONS) {
      const withExt = normalized + suffix
      if (isExistingFile(withExt)) return withExt
    }
    for (const suffix of RESOLVE_EXTENSIONS) {
      const indexFile = path.join(normalized, `index${suffix}`)
      if (isExistingFile(indexFile)) return indexFile
    }
  }

  return undefined
}

function resolveBaseUrl(
  projectRoot: string,
  options: ts.CompilerOptions,
): string {
  if (!options.baseUrl) return normalizePath(projectRoot)
  if (path.isAbsolute(options.baseUrl)) {
    return normalizePath(options.baseUrl)
  }
  return normalizePath(path.join(projectRoot, options.baseUrl))
}

/** Resolve tsconfig paths + baseUrl the same way Ryunix webpack aliases work. */
export function resolveModuleSpecifier(
  moduleSpecifier: string,
  projectRoot: string,
  options: ts.CompilerOptions,
  fromFile?: string,
): string | undefined {
  const baseUrl = resolveBaseUrl(projectRoot, options)

  const paths = options.paths ?? {}

  const resolveMapped = (mapped: string): string | undefined => {
    return tryResolveFile(path.join(baseUrl, mapped))
  }

  for (const [pattern, targets] of Object.entries(paths)) {
    const star = pattern.indexOf('*')
    if (star === -1) {
      if (pattern !== moduleSpecifier) continue
      for (const target of targets) {
        const hit = resolveMapped(target)
        if (hit) return hit
      }
      continue
    }

    const prefix = pattern.slice(0, star)
    const suffix = pattern.slice(star + 1)
    if (!moduleSpecifier.startsWith(prefix)) continue
    if (suffix && !moduleSpecifier.endsWith(suffix)) continue

    let matched = moduleSpecifier.slice(
      prefix.length,
      suffix ? moduleSpecifier.length - suffix.length : undefined,
    )
    if (matched.startsWith('/')) matched = matched.slice(1)

    for (const target of targets) {
      const tStar = target.indexOf('*')
      const mapped =
        tStar === -1
          ? target
          : target.slice(0, tStar) + matched + target.slice(tStar + 1)
      const hit = resolveMapped(mapped)
      if (hit) return hit
    }
  }

  if (moduleSpecifier.startsWith('.')) {
    const fromDir = fromFile ? path.dirname(normalizePath(fromFile)) : baseUrl
    return tryResolveFile(path.join(fromDir, moduleSpecifier))
  }

  return undefined
}

export function isBundlerResolvedImport(spec: string): boolean {
  if (ASSET_MODULE.test(spec)) return true
  if (
    spec.startsWith('@/') ||
    spec.startsWith('./') ||
    spec.startsWith('../')
  ) {
    return true
  }
  return RESOLVE_EXTENSIONS.some((ext) => spec.endsWith(ext))
}

const JSX_INVALID_ELEMENT = 2604
const JSX_GLOBAL_NAME_COLLISION = new Set([
  'Image',
  'Event',
  'History',
  'Location',
  'Navigator',
  'Screen',
  'Option',
])

function jsxTagFromDiagnostic(d: ts.Diagnostic): string | undefined {
  if (d.code !== JSX_INVALID_ELEMENT || !d.file || d.start === undefined) {
    return undefined
  }
  const text = d.file.getFullText()
  const line = d.file.getLineAndCharacterOfPosition(d.start).line
  const lineStart = d.file.getPositionOfLineAndCharacter(line, 0)
  const nextLine = d.file.getPositionOfLineAndCharacter(line + 1, 0)
  const lineText = text.slice(lineStart, nextLine)
  const match = lineText.match(/<([A-Z][A-Za-z0-9]*)/)
  return match?.[1]
}

/**
 * Drop TS2307 when webpack/Ryunix would resolve the module (assets, .ryx, alias paths).
 * Drop TS2604 for capitalized tags that collide with browser globals when unimported.
 */
export function filterFalsePositiveModuleDiagnostics(
  diagnostics: ts.Diagnostic[],
  projectRoot: string,
  options: ts.CompilerOptions,
  entrySource?: ts.SourceFile,
): ts.Diagnostic[] {
  const importedNames = new Set<string>()
  if (entrySource) {
    entrySource.statements.forEach((stmt) => {
      if (!ts.isImportDeclaration(stmt) || !stmt.importClause) return
      const clause = stmt.importClause
      if (clause.name) importedNames.add(clause.name.text)
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const el of clause.namedBindings.elements) {
          importedNames.add(el.name.text)
        }
      }
    })
  }

  return diagnostics.filter((d) => {
    if (d.code === JSX_INVALID_ELEMENT) {
      const tag = jsxTagFromDiagnostic(d)
      if (
        tag &&
        JSX_GLOBAL_NAME_COLLISION.has(tag) &&
        !importedNames.has(tag)
      ) {
        return false
      }
    }

    const spec = moduleSpecifierFromDiagnostic(d)
    if (!spec || !isBundlerResolvedImport(spec)) return true
    const resolved = resolveModuleSpecifier(spec, projectRoot, options)
    return !resolved
  })
}
