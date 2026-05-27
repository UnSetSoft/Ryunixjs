import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

const SCRIPT_EXTS = ['.ryx', '.js', '.jsx', '.ts', '.tsx', '']

/** PascalCase JSX component tag at cursor, e.g. `<Header` */
export function getComponentTagAt(
  document: vscode.TextDocument,
  position: vscode.Position,
): string | undefined {
  const line = document.lineAt(position.line).text
  const before = line.slice(0, position.character + 1)
  const m = before.match(/<([A-Z][\w]*)/)
  return m?.[1]
}

function resolveModulePath(
  documentUri: vscode.Uri,
  specifier: string,
): string | undefined {
  const docDir = path.dirname(documentUri.fsPath)
  let base: string

  if (specifier.startsWith('@/')) {
    const projectRoot =
      vscode.workspace.getWorkspaceFolder(documentUri)?.uri.fsPath
    if (!projectRoot) return undefined
    base = path.join(projectRoot, specifier.slice(2))
  } else if (specifier.startsWith('.')) {
    base = path.resolve(docDir, specifier)
  } else {
    return undefined
  }

  const candidates: string[] = []
  for (const ext of SCRIPT_EXTS) {
    if (ext) {
      candidates.push(`${base}${ext}`)
      candidates.push(path.join(base, `index${ext}`))
    } else {
      candidates.push(base)
    }
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate
    }
  }

  return undefined
}

function findImportSpecifier(
  document: vscode.TextDocument,
  symbol: string,
): string | undefined {
  const text = document.getText()

  const defaultImport = new RegExp(
    `import\\s+${symbol}\\s+from\\s+['"]([^'"]+)['"]`,
    'm',
  )
  const defaultMatch = defaultImport.exec(text)
  if (defaultMatch?.[1]) return defaultMatch[1]

  const namedImport = new RegExp(
    `import\\s+\\{[^}]*\\b${symbol}\\b[^}]*\\}\\s+from\\s+['"]([^'"]+)['"]`,
    'm',
  )
  const namedMatch = namedImport.exec(text)
  if (namedMatch?.[1]) return namedMatch[1]

  return undefined
}

/** Resolve local component imports to a file location (export line). */
export function resolveLocalComponentLocation(
  document: vscode.TextDocument,
  position: vscode.Position,
): vscode.Location | undefined {
  const symbol =
    getComponentTagAt(document, position) ?? getWordAtImport(document, position)
  if (!symbol || symbol[0] !== symbol[0].toUpperCase()) return undefined

  const specifier = findImportSpecifier(document, symbol)
  if (!specifier) return undefined

  const target = resolveModulePath(document.uri, specifier)
  if (!target) return undefined

  const content = fs.readFileSync(target, 'utf8')
  const patterns = [
    new RegExp(`\\bexport\\s+default\\s+function\\s+${symbol}\\b`),
    new RegExp(`\\bexport\\s+function\\s+${symbol}\\b`),
    new RegExp(`\\bexport\\s+const\\s+${symbol}\\b`),
    new RegExp(`\\bfunction\\s+${symbol}\\b`),
    new RegExp(`\\bconst\\s+${symbol}\\b`),
  ]

  for (const re of patterns) {
    const m = re.exec(content)
    if (m?.index !== undefined) {
      const before = content.slice(0, m.index)
      const line = before.split('\n').length - 1
      const character = before.length - before.lastIndexOf('\n') - 1
      return new vscode.Location(
        vscode.Uri.file(target),
        new vscode.Position(line, character),
      )
    }
  }

  return new vscode.Location(vscode.Uri.file(target), new vscode.Position(0, 0))
}

function getWordAtImport(
  document: vscode.TextDocument,
  position: vscode.Position,
): string | undefined {
  const line = document.lineAt(position.line).text
  const re = /[\w$]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    const start = m.index
    const end = start + m[0].length
    if (position.character >= start && position.character <= end) {
      return m[0]
    }
  }
  return undefined
}
