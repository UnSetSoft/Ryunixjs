import * as fs from 'fs'
import * as path from 'path'
import ts from 'typescript'
import { resolveModuleSpecifier } from './diagnostic-filters'

const RYX_EXT = /\.ryx$/i

function normalizePath(filePath: string): string {
  try {
    return fs.realpathSync.native(path.resolve(filePath))
  } catch {
    return path.resolve(filePath)
  }
}

/** Static import specifiers in a source file. */
export function collectModuleSpecifiers(sourceFile: ts.SourceFile): string[] {
  const specs: string[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specs.push(node.moduleSpecifier.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return specs
}

export interface VirtualRyxSource {
  virtualPath: string
  ryxPath: string
  sourceFile: ts.SourceFile
}

/** Virtual `.tsx` sources for entry `.ryx` and resolved `.ryx` imports. */
export function buildVirtualRyxProgramSources(
  entryRyxPath: string,
  entryContent: string,
  projectRoot: string,
  options: ts.CompilerOptions,
  readFile: (ryxPath: string) => string,
  maxDepth = 6,
): VirtualRyxSource[] {
  const out: VirtualRyxSource[] = []
  const seenRyx = new Set<string>()
  const queue: Array<{ ryxPath: string; content: string; depth: number }> = [
    { ryxPath: normalizePath(entryRyxPath), content: entryContent, depth: 0 },
  ]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (seenRyx.has(current.ryxPath)) continue
    seenRyx.add(current.ryxPath)

    const virtualPath = current.ryxPath.replace(RYX_EXT, '.tsx')
    const sourceFile = ts.createSourceFile(
      virtualPath,
      current.content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    out.push({
      virtualPath: normalizePath(virtualPath),
      ryxPath: current.ryxPath,
      sourceFile,
    })

    if (current.depth >= maxDepth) continue

    for (const spec of collectModuleSpecifiers(sourceFile)) {
      const resolved = resolveModuleSpecifier(
        spec,
        projectRoot,
        options,
        current.ryxPath,
      )
      if (!resolved || !RYX_EXT.test(resolved) || seenRyx.has(resolved))
        continue
      queue.push({
        ryxPath: resolved,
        content: readFile(resolved),
        depth: current.depth + 1,
      })
    }
  }

  return out
}

export function virtualSourceMap(
  sources: VirtualRyxSource[],
): Map<string, ts.SourceFile> {
  return new Map(sources.map((s) => [s.virtualPath, s.sourceFile]))
}
