import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import ts from 'typescript'
import {
  mergeCompilerPaths,
  pathsFromRyunixConfig,
} from './ryunix-config-paths'
import { filterFalsePositiveModuleDiagnostics } from './diagnostic-filters'
import {
  ryunixTypesPathEntries,
  resolveRyunixTypesEntry,
} from './ryunix-types-resolve'

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

/** TypeScript only tracks standard script extensions; map `.ryx` → `.tsx`. */
function toServicePath(filePath: string): string {
  const n = normalizePath(filePath)
  return RYX_EXT.test(n) ? n.replace(RYX_EXT, '.tsx') : n
}

function toDiskPath(filePath: string): string {
  const n = normalizePath(filePath)
  if (/\.tsx$/i.test(n)) {
    const ryx = n.replace(/\.tsx$/i, '.ryx')
    if (fs.existsSync(ryx)) return ryx
  }
  return n
}

function readDiskContent(
  diskPath: string,
  openContents: Map<string, string>,
): string {
  const n = normalizePath(diskPath)
  if (openContents.has(n)) return openContents.get(n)!
  if (fs.existsSync(n)) return fs.readFileSync(n, 'utf8')
  return ''
}

function scriptKindFor(fileName: string): ts.ScriptKind {
  const ext = path.extname(fileName).toLowerCase()
  if (ext === '.ryx' || ext === '.tsx' || ext === '.jsx')
    return ts.ScriptKind.TSX
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

export interface LoadCompilerOptionsConfig {
  preferTsconfig?: boolean
  checkJsOverride?: boolean
}

export interface RyunixTsProgramOptions {
  checkJsOverride?: boolean
  preferTsconfig?: boolean
}

function loadCompilerOptions(
  root: string,
  config: LoadCompilerOptionsConfig = {},
): ts.CompilerOptions {
  const preferTsconfig = config.preferTsconfig !== false
  const base = defaultCompilerOptions(root)
  let options = { ...base }
  if (preferTsconfig) {
    const configNames = ['jsconfig.json', 'tsconfig.json']
    for (const name of configNames) {
      const configPath = path.join(root, name)
      if (!fs.existsSync(configPath)) continue
      const parsed = ts.parseConfigFileTextToJson(
        configPath,
        fs.readFileSync(configPath, 'utf8'),
      )
      if (parsed.error) continue
      // Do not pass `base.paths` here — TS skips jsconfig paths when existingOptions.paths is set.
      const cfg = ts.parseJsonConfigFileContent(
        parsed.config,
        ts.sys,
        root,
        {},
        configPath,
      )
      options = { ...base, ...cfg.options }
      break
    }
  }

  if (config.checkJsOverride !== undefined) {
    options.checkJs = config.checkJsOverride
  }

  const paths = mergeCompilerPaths(
    { ...(options.paths ?? {}) },
    pathsFromRyunixConfig(root),
  )
  const typesEntry = ryunixTypesPathEntries(root)
  if (typesEntry) {
    paths['@unsetsoft/ryunixjs'] = typesEntry
  }
  options.paths = paths
  return options
}

export { loadCompilerOptions }

/** TypeScript LanguageService backed project for Ryunix workspaces. */
export class RyunixTsProgram {
  private readonly root: string
  private readonly typesPath: string
  private readonly programOptions: RyunixTsProgramOptions
  private compilerOptions: ts.CompilerOptions
  private fileNames: string[] = []
  private versions = new Map<string, number>()
  /** In-memory buffers for open editors (avoids stale/missing disk reads). */
  private openContents = new Map<string, string>()
  private service: ts.LanguageService | undefined

  constructor(
    workspaceRoot: string,
    extensionTypesDir: string,
    options: RyunixTsProgramOptions = {},
  ) {
    this.root = normalizePath(workspaceRoot)
    this.typesPath = path.join(extensionTypesDir, 'types', 'ryunix.d.ts')
    this.programOptions = options
    this.compilerOptions = loadCompilerOptions(this.root, {
      preferTsconfig: options.preferTsconfig,
      checkJsOverride: options.checkJsOverride,
    })
    this.refreshFileList()
    this.rebuildService()
  }

  refreshFileList(): void {
    const files: string[] = []
    walkProjectFiles(this.root, files)
    const hasFullRyunixTypes = Boolean(resolveRyunixTypesEntry(this.root))
    if (fs.existsSync(this.typesPath) && !hasFullRyunixTypes) {
      files.push(normalizePath(this.typesPath))
    }
    for (const open of this.openContents.keys()) {
      if (!files.includes(open)) files.push(open)
    }
    this.fileNames = [...new Set(files.map(toServicePath))].sort()
  }

  /** Track an open document with latest editor text. */
  syncOpenDocument(filePath: string, content: string): void {
    const disk = normalizePath(filePath)
    const service = toServicePath(disk)
    this.openContents.set(disk, content)
    const ver = (this.versions.get(service) ?? 0) + 1
    this.versions.set(service, ver)
    if (!this.fileNames.includes(service)) {
      this.fileNames.push(service)
      this.fileNames.sort()
      this.rebuildService()
    }
  }

  closeDocument(filePath: string): void {
    const disk = normalizePath(filePath)
    this.openContents.delete(disk)
  }

  private rebuildService(): void {
    this.compilerOptions = loadCompilerOptions(this.root, {
      preferTsconfig: this.programOptions.preferTsconfig,
      checkJsOverride: this.programOptions.checkJsOverride,
    })
    const host = this.createHost(this.compilerOptions)
    this.service = ts.createLanguageService(host, ts.createDocumentRegistry())
  }

  private createHost(options: ts.CompilerOptions): ts.LanguageServiceHost {
    const root = this.root
    const openContents = this.openContents

    return {
      getScriptFileNames: () => this.fileNames,
      getScriptVersion: (fileName) =>
        String(this.versions.get(normalizePath(fileName)) ?? 0),
      getScriptSnapshot: (fileName) => {
        const disk = toDiskPath(fileName)
        return ts.ScriptSnapshot.fromString(readDiskContent(disk, openContents))
      },
      getCurrentDirectory: () => root,
      getCompilationSettings: () => options,
      getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
      fileExists: (fileName) => {
        const disk = toDiskPath(fileName)
        const n = normalizePath(disk)
        return openContents.has(n) || fs.existsSync(n)
      },
      readFile: (fileName) => {
        const disk = toDiskPath(fileName)
        const n = normalizePath(disk)
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
    const disk = normalizePath(filePath)
    const service = toServicePath(disk)
    if (content !== undefined) this.openContents.set(disk, content)
    this.versions.set(service, (this.versions.get(service) ?? 0) + 1)
    if (
      SCRIPT_EXTS.some((e) => disk.endsWith(e)) &&
      !this.fileNames.includes(service)
    ) {
      this.fileNames.push(service)
      this.fileNames.sort()
      this.rebuildService()
    }
  }

  onFileDeleted(filePath: string): void {
    const disk = normalizePath(filePath)
    const service = toServicePath(disk)
    this.fileNames = this.fileNames.filter((f) => f !== service)
    this.openContents.delete(disk)
    this.versions.delete(service)
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
    const disk = normalizePath(filePath)
    const service = toServicePath(disk)
    if (!this.fileNames.includes(service)) {
      this.fileNames.push(service)
      this.fileNames.sort()
      this.rebuildService()
    }
    return service
  }

  private safe<T>(
    filePath: string,
    fn: (normalized: string) => T,
  ): T | undefined {
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
      this.safe(filePath, (servicePath) => {
        const s = this.svc()
        const raw = [
          ...s.getSyntacticDiagnostics(servicePath),
          ...s.getSemanticDiagnostics(servicePath),
        ]
        const disk = toDiskPath(servicePath)
        const content = readDiskContent(disk, this.openContents)
        const entrySource = ts.createSourceFile(
          servicePath,
          content,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        )
        const filtered = filterFalsePositiveModuleDiagnostics(
          raw,
          this.root,
          this.compilerOptions,
          entrySource,
        )
        return filtered.map((d) =>
          d.file
            ? {
                ...d,
                file: { ...d.file, fileName: toDiskPath(d.file.fileName) },
              }
            : d,
        )
      }) ?? []
    )
  }

  getDefinition(filePath: string, position: number) {
    const result = this.safe(filePath, (servicePath) =>
      this.svc().getDefinitionAndBoundSpan(servicePath, position),
    )
    if (!result?.definitions) return result
    return {
      ...result,
      definitions: result.definitions.map((d) => ({
        ...d,
        fileName: toDiskPath(d.fileName),
      })),
    }
  }

  getReferences(filePath: string, position: number) {
    const refs = this.safe(filePath, (servicePath) =>
      this.svc().getReferencesAtPosition(servicePath, position),
    )
    return refs?.map((r) => ({ ...r, fileName: toDiskPath(r.fileName) }))
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
    const locs = this.safe(filePath, (servicePath) =>
      this.svc().findRenameLocations(servicePath, position, false, false),
    )
    return locs?.map((r) => ({ ...r, fileName: toDiskPath(r.fileName) }))
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

export {
  buildVirtualRyxProgramSources,
  collectModuleSpecifiers,
} from './virtual-program'
export { resolveModuleSpecifier } from './diagnostic-filters'
