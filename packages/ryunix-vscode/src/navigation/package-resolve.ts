import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

const RYUNIX_PKG = '@unsetsoft/ryunixjs'

/** Resolves @unsetsoft/ryunixjs install (node_modules or monorepo packages/core). */
export function resolveRyunixPackageRoot(
  documentUri: vscode.Uri,
): string | undefined {
  const folders = vscode.workspace.getWorkspaceFolder(documentUri)
  if (!folders) return undefined

  const roots: string[] = [folders.uri.fsPath]
  const parent = path.dirname(folders.uri.fsPath)
  if (path.basename(parent) === 'packages') {
    roots.push(path.dirname(parent))
  }

  for (const root of roots) {
    const fromNodeModules = path.join(
      root,
      'node_modules',
      RYUNIX_PKG,
      'package.json',
    )
    if (fs.existsSync(fromNodeModules)) {
      return path.dirname(fromNodeModules)
    }

    const monorepoCore = path.join(root, 'packages', 'core', 'package.json')
    if (fs.existsSync(monorepoCore)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(monorepoCore, 'utf8')) as {
          name?: string
        }
        if (pkg.name === RYUNIX_PKG) return path.dirname(monorepoCore)
      } catch {
        /* ignore */
      }
    }
  }

  return undefined
}

export function getRyunixEntryFile(packageRoot: string): string | undefined {
  const pkgPath = path.join(packageRoot, 'package.json')
  if (!fs.existsSync(pkgPath)) return undefined

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      module?: string
      main?: string
    }
    const rel = pkg.module ?? pkg.main
    if (!rel) return undefined
    const full = path.join(packageRoot, rel)
    return fs.existsSync(full) ? full : undefined
  } catch {
    return undefined
  }
}

function listJsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listJsFiles(full))
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))
      out.push(full)
  }
  return out
}

function indexToPosition(
  content: string,
  index: number,
): vscode.Position {
  const before = content.slice(0, index)
  const lines = before.split('\n')
  const line = lines.length - 1
  const character = lines[lines.length - 1]?.length ?? 0
  return new vscode.Position(line, character)
}

const SYMBOL_PATTERNS = (name: string): RegExp[] => [
  new RegExp(`\\bfunction\\s+${name}\\b`),
  new RegExp(`\\bconst\\s+${name}\\b`),
  new RegExp(`\\bexport\\s+function\\s+${name}\\b`),
  new RegExp(`\\bexport\\s*\\{[^}]*\\b${name}\\b`),
  new RegExp(`\\b${name}\\s*=`),
]

/** Find symbol definition inside installed @unsetsoft/ryunixjs sources. */
export function findRyunixSymbolLocation(
  packageRoot: string,
  symbol: string,
): vscode.Location | undefined {
  const searchDirs: string[] = []
  const srcLib = path.join(packageRoot, 'src', 'lib')
  const dist = path.join(packageRoot, 'dist')

  if (fs.existsSync(srcLib)) searchDirs.push(srcLib)
  if (fs.existsSync(dist)) searchDirs.push(dist)

  for (const dir of searchDirs) {
    for (const file of listJsFiles(dir)) {
      const content = fs.readFileSync(file, 'utf8')
      for (const re of SYMBOL_PATTERNS(symbol)) {
        const m = re.exec(content)
        if (m?.index !== undefined) {
          return new vscode.Location(
            vscode.Uri.file(file),
            indexToPosition(content, m.index),
          )
        }
      }
    }
  }

  const entry = getRyunixEntryFile(packageRoot)
  if (entry) {
    return new vscode.Location(vscode.Uri.file(entry), new vscode.Position(0, 0))
  }

  return undefined
}
