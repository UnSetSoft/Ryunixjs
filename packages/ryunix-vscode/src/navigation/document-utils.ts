import * as vscode from 'vscode'
import { RYUNIX_EXPORT_NAMES } from '../constants/ryunix-exports'

const RYUNIX_MODULE = '@unsetsoft/ryunixjs'
const WORD_RE = /[\w$]+/g

export function getWordAt(
  document: vscode.TextDocument,
  position: vscode.Position,
): string | undefined {
  const line = document.lineAt(position.line).text
  let match: RegExpExecArray | null
  while ((match = WORD_RE.exec(line)) !== null) {
    const start = match.index
    const end = start + match[0].length
    if (position.character >= start && position.character <= end) {
      return match[0]
    }
  }
  return undefined
}

export function fileImportsRyunix(document: vscode.TextDocument): boolean {
  const text = document.getText()
  return (
    text.includes(`from '${RYUNIX_MODULE}'`) ||
    text.includes(`from "${RYUNIX_MODULE}"`)
  )
}

export function getRyunixImportedSymbols(
  document: vscode.TextDocument,
): Set<string> {
  const symbols = new Set<string>()
  const importRe =
    /import\s+(?:(\w+)\s*,?\s*)?\{([^}]+)\}\s*from\s*['"]@unsetsoft\/ryunixjs['"]/g

  let m: RegExpExecArray | null
  const text = document.getText()
  while ((m = importRe.exec(text)) !== null) {
    if (m[1]) symbols.add(m[1])
    const block = m[2]
    for (const part of block.split(',')) {
      const trimmed = part.trim()
      if (!trimmed) continue
      const alias = trimmed.split(/\s+as\s+/i)
      const name = (alias[1] ?? alias[0]).trim()
      if (name) symbols.add(name)
    }
  }

  return symbols
}

export function isRyunixExport(symbol: string): boolean {
  return (RYUNIX_EXPORT_NAMES as readonly string[]).includes(symbol)
}

export function getModuleSpecifierRange(
  document: vscode.TextDocument,
  position: vscode.Position,
): vscode.Range | undefined {
  const line = document.lineAt(position.line).text
  const re = /['"]@unsetsoft\/ryunixjs['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    const start = m.index + 1
    const end = start + RYUNIX_MODULE.length
    if (position.character >= start && position.character <= end) {
      return new vscode.Range(position.line, start, position.line, end)
    }
  }
  return undefined
}

const CLASSNAME_RE =
  /className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*['"`]([^'"`]+)['"`]\s*\})/g

/** Single utility/class token under cursor inside className="..." */
export function getClassNameAt(
  document: vscode.TextDocument,
  position: vscode.Position,
): string | undefined {
  const line = document.lineAt(position.line).text
  let m: RegExpExecArray | null
  CLASSNAME_RE.lastIndex = 0
  while ((m = CLASSNAME_RE.exec(line)) !== null) {
    const attrStart = m.index
    const attrEnd = m.index + m[0].length
    if (position.character < attrStart || position.character > attrEnd) continue

    const raw = m[1] ?? m[2] ?? m[3] ?? ''
    const valueStart = line.indexOf(raw, attrStart)
    for (const cls of raw.split(/\s+/).filter(Boolean)) {
      const clsStart = line.indexOf(cls, valueStart)
      const clsEnd = clsStart + cls.length
      if (position.character >= clsStart && position.character <= clsEnd) {
        return cls
      }
    }
  }
  return undefined
}

/** JSX opening tag name at cursor, e.g. `<main` */
export function getHtmlTagAt(
  document: vscode.TextDocument,
  position: vscode.Position,
): string | undefined {
  const line = document.lineAt(position.line).text
  const before = line.slice(0, position.character + 1)
  const m = before.match(/<([a-zA-Z][\w.-]*)[\s>/]?[^<]*$/)
  return m?.[1]?.toLowerCase()
}
