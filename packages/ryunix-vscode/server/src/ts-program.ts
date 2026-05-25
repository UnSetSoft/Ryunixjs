import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import ts from 'typescript'

const RYX_EXT = /\.ryx$/i
const SCRIPT_EXTS = ['.ryx', '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.ryunix',
  'dist',
  'out',
  'build',
  '.next',
])

function hasProjectConfig(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, 'jsconfig.json')) ||
    fs.existsSync(path.join(dir, 'tsconfig.json'))
  )
}

function hasRyunixConfig(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'ryunix.config.js'))
}

/** Walk up from `start` looking for ryunix.config.js (max 8 levels). */
function findRyunixConfigUp(start: string): string | undefined {
  let dir = normalizePath(start)
  for (let i = 0; i < 8; i++) {
    if (hasRyunixConfig(dir)) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return undefined
}

/** Walk down from `start` (max depth) for the shallowest ryunix.config.js. */
function findRyunixConfigDown(
  start: string,
  maxDepth: number,
): string | undefined {
  let shallowest: string | undefined
  let shallowestDepth = Infinity

  const visit = (dir: string, depth: number) => {
    if (depth > maxDepth) return
    if (hasRyunixConfig(dir)) {
      if (depth < shallowestDepth) {
        shallowestDepth = depth
        shallowest = dir
      }
      return
    }
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (!e.isDirectory() || SKIP_DIRS.has(e.name)) continue
      visit(path.join(dir, e.name), depth + 1)
    }
  }

  visit(normalizePath(start), 0)
  return shallowest
}

function findRyunixProjectDir(workspaceRoot: string): string | undefined {
  const root = normalizePath(workspaceRoot)
  if (hasRyunixConfig(root)) return root
  const up = findRyunixConfigUp(root)
  if (up) return up
  return findRyunixConfigDown(root, 4)
}

/**
 * Prefer folder with jsconfig/tsconfig, else ryunix.config.js, else workspace root.
 */
export function resolveProjectRoot(workspaceRoot: string): string {
  const root = normalizePath(workspaceRoot)
  if (hasProjectConfig(root)) return root

  const ryunixDir = findRyunixProjectDir(root)
  if (ryunixDir) {
    if (hasProjectConfig(ryunixDir)) return ryunixDir
    return ryunixDir
  }

  return root
}

export function normalizePath(filePath: string): string {
  try {
    return fs.realpathSync.native(path.resolve(filePath))
  } catch {
    return path.resolve(filePath)
  }
}

function scriptKindFor(fileName: string): ts.ScriptKind {
  const ext = path.extname(fileName).toLowerCase()
  if (ext === '.ryx' || ext === '.tsx' || ext === '.jsx') return ts.ScriptKind.TSX
  if (ext === '.ts') return ts.ScriptKind.TS
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') return ts.ScriptKind.JS
  return ts.ScriptKind.Unknown
}

function walkProjectFiles(root: string, out: string[]): void {
  const skip = new Set([
    'node_modules',
    '.ryunix',
    'dist',
    'build',
    '.git',
    'out',
    '.next',
  ])
  const visit = (dir: string) => {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (skip.has(e.name)) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) visit(full)
      else if (SCRIPT_EXTS.some((x) => e.name.endsWith(x)))
        out.push(normalizePath(full))
    }
  }
  visit(normalizePath(root))
}

function defaultCompilerOptions(root: string): ts.CompilerOptions {
  return {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.React,
    jsxFactory: 'Ryunix.createElement',
    jsxFragmentFactory: 'Ryunix.Fragment',
    allowJs: true,
    checkJs: false,
    skipLibCheck: true,
    noEmit: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    baseUrl: root,
    paths: {
      '@unsetsoft/ryunixjs': ['node_modules/@unsetsoft/ryunixjs'],
    },
  }
}

function loadCompilerOptions(root: string): ts.CompilerOptions {
  const base = defaultCompilerOptions(root)
  const configNames = ['jsconfig.json', 'tsconfig.json']
  for (const name of configNames) {
    const configPath = path.join(root, name)
    if (!fs.existsSync(configPath)) continue
    const parsed = ts.parseConfigFileTextToJson(
      configPath,
      fs.readFileSync(configPath, 'utf8'),
    )
    if (parsed.error) continue
    const cfg = ts.parseJsonConfigFileContent(
      parsed.config,
      ts.sys,
      root,
      base,
      configPath,
    )
    return { ...base, ...cfg.options }
  }
  return base
}

/** TypeScript LanguageService backed project for Ryunix workspaces. */
export class RyunixTsProgram {
  private readonly root: string
  private readonly typesPath: string
  private fileNames: string[] = []
  private versions = new Map<string, number>()
  /** In-memory buffers for open editors (avoids stale/missing disk reads). */
  private openContents = new Map<string, string>()
  private service: ts.LanguageService | undefined

  constructor(workspaceRoot: string, extensionTypesDir: string) {
    this.root = normalizePath(workspaceRoot)
    this.typesPath = path.join(extensionTypesDir, 'types', 'ryunix.d.ts')
    this.refreshFileList()
    this.rebuildService()
  }

  refreshFileList(): void {
    const files: string[] = []
    walkProjectFiles(this.root, files)
    if (fs.existsSync(this.typesPath)) files.push(normalizePath(this.typesPath))
    for (const open of this.openContents.keys()) {
      if (!files.includes(open)) files.push(open)
    }
    this.fileNames = [...new Set(files)].sort()
  }

  /** Track an open document with latest editor text. */
  syncOpenDocument(filePath: string, content: string): void {
    const n = normalizePath(filePath)
    this.openContents.set(n, content)
    const ver = (this.versions.get(n) ?? 0) + 1
    this.versions.set(n, ver)
    if (!this.fileNames.includes(n)) {
      this.fileNames.push(n)
      this.fileNames.sort()
      this.rebuildService()
    }
  }

  closeDocument(filePath: string): void {
    const n = normalizePath(filePath)
    this.openContents.delete(n)
  }

  private rebuildService(): void {
    const options = loadCompilerOptions(this.root)
    const host = this.createHost(options)
    this.service = ts.createLanguageService(
      host,
      ts.createDocumentRegistry(),
    )
  }

  private createHost(
    options: ts.CompilerOptions,
  ): ts.LanguageServiceHost {
    const root = this.root
    const openContents = this.openContents

    return {
      getScriptFileNames: () => this.fileNames,
      getScriptVersion: (fileName) =>
        String(this.versions.get(normalizePath(fileName)) ?? 0),
      getScriptSnapshot: (fileName) => {
        const n = normalizePath(fileName)
        if (openContents.has(n)) {
          return ts.ScriptSnapshot.fromString(openContents.get(n)!)
        }
        if (!fs.existsSync(n)) {
          return ts.ScriptSnapshot.fromString('')
        }
        return ts.ScriptSnapshot.fromString(fs.readFileSync(n, 'utf8'))
      },
      getCurrentDirectory: () => root,
      getCompilationSettings: () => options,
      getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
      fileExists: (fileName) => {
        const n = normalizePath(fileName)
        return openContents.has(n) || fs.existsSync(n)
      },
      readFile: (fileName) => {
        const n = normalizePath(fileName)
        if (openContents.has(n)) return openContents.get(n)!
        return fs.existsSync(n) ? fs.readFileSync(n, 'utf8') : undefined
      },
      readDirectory: ts.sys.readDirectory,
      directoryExists: ts.sys.directoryExists,
      getDirectories: ts.sys.getDirectories,
      useCaseSensitiveFileNames: () => true,
      getScriptKind: (fileName) => scriptKindFor(fileName),
      getNewLine: () => '\n',
    }
  }

  onFileChanged(filePath: string, content?: string): void {
    const n = normalizePath(filePath)
    if (content !== undefined) this.openContents.set(n, content)
    this.versions.set(n, (this.versions.get(n) ?? 0) + 1)
    if (SCRIPT_EXTS.some((e) => n.endsWith(e)) && !this.fileNames.includes(n)) {
      this.fileNames.push(n)
      this.fileNames.sort()
      this.rebuildService()
    }
  }

  onFileDeleted(filePath: string): void {
    const n = normalizePath(filePath)
    this.fileNames = this.fileNames.filter((f) => f !== n)
    this.openContents.delete(n)
    this.versions.delete(n)
    this.rebuildService()
  }

  /** Merge disk scan with open buffers; avoid full service reset on every watch. */
  refreshFromDisk(): void {
    this.refreshFileList()
    this.rebuildService()
  }

  private svc(): ts.LanguageService {
    if (!this.service) this.rebuildService()
    return this.service!
  }

  private ensureInProgram(filePath: string): string {
    const n = normalizePath(filePath)
    if (!this.fileNames.includes(n)) {
      this.fileNames.push(n)
      this.fileNames.sort()
      this.rebuildService()
    }
    return n
  }

  private safe<T>(filePath: string, fn: (normalized: string) => T): T | undefined {
    try {
      const n = this.ensureInProgram(filePath)
      return fn(n)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Could not find source file')) return undefined
      throw err
    }
  }

  getDiagnostics(filePath: string): ts.Diagnostic[] {
    return (
      this.safe(filePath, (n) => {
        const s = this.svc()
        return [
          ...s.getSyntacticDiagnostics(n),
          ...s.getSemanticDiagnostics(n),
        ]
      }) ?? []
    )
  }

  getDefinition(filePath: string, position: number) {
    return this.safe(filePath, (n) =>
      this.svc().getDefinitionAndBoundSpan(n, position),
    )
  }

  getReferences(filePath: string, position: number) {
    return this.safe(filePath, (n) =>
      this.svc().getReferencesAtPosition(n, position),
    )
  }

  getHover(filePath: string, position: number) {
    return this.safe(filePath, (n) =>
      this.svc().getQuickInfoAtPosition(n, position),
    )
  }

  getCompletions(filePath: string, position: number) {
    return this.safe(filePath, (n) =>
      this.svc().getCompletionsAtPosition(n, position, undefined, {}),
    )
  }

  getDocumentSymbols(filePath: string) {
    return this.safe(filePath, (n) => this.svc().getNavigationTree(n))
  }

  getRename(filePath: string, position: number) {
    return this.safe(filePath, (n) =>
      this.svc().findRenameLocations(n, position, false, false),
    )
  }

  getSignatureHelp(filePath: string, position: number) {
    return this.safe(filePath, (n) =>
      this.svc().getSignatureHelpItems(n, position, undefined),
    )
  }
}

export function isRyunixFile(filePath: string): boolean {
  return RYX_EXT.test(filePath)
}

export function uriToPath(uri: string): string {
  try {
    return normalizePath(fileURLToPath(uri))
  } catch {
    return normalizePath(uri.replace(/^file:\/\//, ''))
  }
}

export function pathToFileUri(filePath: string): string {
  return pathToFileURL(normalizePath(filePath)).href
}
