import * as fs from 'fs'
import ts from 'typescript'

export function scriptKindFor(fileName: string): ts.ScriptKind {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
  if (ext === '.ryx' || ext === '.tsx' || ext === '.jsx')
    return ts.ScriptKind.TSX
  if (ext === '.ts') return ts.ScriptKind.TS
  return ts.ScriptKind.JS
}

export function spanToRange(
  fileName: string,
  span: { start: number; length: number },
): {
  start: { line: number; character: number }
  end: { line: number; character: number }
} {
  const content = fs.existsSync(fileName)
    ? fs.readFileSync(fileName, 'utf8')
    : ''
  const sf = ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(fileName),
  )
  const start = sf.getLineAndCharacterOfPosition(span.start)
  const end = sf.getLineAndCharacterOfPosition(span.start + span.length)
  return {
    start: { line: start.line, character: start.character },
    end: { line: end.line, character: end.character },
  }
}

export function flattenMessage(
  msg: string | ts.DiagnosticMessageChain,
): string {
  if (typeof msg === 'string') return msg
  let text = msg.messageText
  if (msg.next) {
    for (const n of msg.next) text += flattenMessage(n)
  }
  return text
}
