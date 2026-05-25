import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  CompletionItem,
  CompletionItemKind,
  Location,
  Diagnostic,
  DiagnosticSeverity,
  Hover,
  MarkupContent,
  MarkupKind,
  DocumentSymbol,
  SymbolKind,
  FileChangeType,
} from 'vscode-languageserver/node'
import * as fs from 'fs'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Position } from 'vscode-languageserver/node'
import ts from 'typescript'
import {
  formatQuickInfoMarkdown,
  importLineFromDefinition,
} from './format-hover'
import { flattenMessage, spanToRange } from './positions'
import {
  pathToFileUri,
  resolveProjectRoot,
  RyunixTsProgram,
  uriToPath,
} from './ts-program'

const connection = createConnection(ProposedFeatures.all)
const documents = new TextDocuments(TextDocument)

let program: RyunixTsProgram | undefined

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const root = params.workspaceFolders?.[0]?.uri ?? params.rootUri ?? ''
  const workspaceRoot = root
    ? resolveProjectRoot(uriToPath(root))
    : process.cwd()
  const extensionPath = params.initializationOptions?.extensionPath ?? ''

  program = new RyunixTsProgram(workspaceRoot, extensionPath)

  const syncDoc = (doc: TextDocument) => {
    program?.syncOpenDocument(uriToPath(doc.uri), doc.getText())
  }

  documents.onDidOpen((e) => {
    syncDoc(e.document)
    validate(e.document)
  })

  documents.onDidChangeContent((change) => {
    syncDoc(change.document)
    validate(change.document)
  })

  documents.onDidClose((change) => {
    program?.closeDocument(uriToPath(change.document.uri))
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics: [] })
  })

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['.', "'", '"', '/', '<'],
      },
      definitionProvider: true,
      referencesProvider: true,
      hoverProvider: true,
      documentSymbolProvider: true,
      renameProvider: { prepareProvider: false },
      signatureHelpProvider: { triggerCharacters: ['(', ','] },
    },
  }
})

connection.onInitialized(() => {
  for (const doc of documents.all()) {
    program?.syncOpenDocument(uriToPath(doc.uri), doc.getText())
    validate(doc)
  }
})

documents.listen(connection)
connection.listen()

function wordAtPosition(doc: TextDocument, position: Position): string {
  const line = doc.getText({
    start: { line: position.line, character: 0 },
    end: { line: position.line, character: 1 << 20 },
  })
  const re = /[\w$]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    const start = m.index
    const end = start + m[0].length
    if (position.character >= start && position.character <= end) {
      return m[0]
    }
  }
  return ''
}

function validate(textDocument: TextDocument): void {
  if (!program || !textDocument.uri.endsWith('.ryx')) return
  const filePath = uriToPath(textDocument.uri)
  const diags = program.getDiagnostics(filePath)
  const diagnostics: Diagnostic[] = []

  for (const d of diags) {
    if (!d.file || d.start === undefined) continue
    const start = d.file.getLineAndCharacterOfPosition(d.start)
    const endPos = d.start + (d.length ?? 0)
    const end = d.file.getLineAndCharacterOfPosition(endPos)
    diagnostics.push({
      severity:
        d.category === ts.DiagnosticCategory.Error
          ? DiagnosticSeverity.Error
          : DiagnosticSeverity.Warning,
      range: {
        start: { line: start.line, character: start.character },
        end: { line: end.line, character: end.character },
      },
      message: flattenMessage(d.messageText),
      source: 'ryunix',
    })
  }

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}

connection.onDidChangeWatchedFiles((params) => {
  if (!program) return
  let needsRefresh = false
  for (const c of params.changes) {
    const p = uriToPath(c.uri)
    if (c.type === FileChangeType.Deleted) {
      program.onFileDeleted(p)
    } else {
      const open = documents.get(c.uri)
      program.onFileChanged(p, open?.getText())
      if (!open) needsRefresh = true
    }
  }
  if (needsRefresh) program.refreshFromDisk()
  for (const doc of documents.all()) {
    program.syncOpenDocument(uriToPath(doc.uri), doc.getText())
    validate(doc)
  }
})

connection.onCompletion((params) => {
  if (!program) return []
  const doc = documents.get(params.textDocument.uri)
  if (!doc) return []
  const filePath = uriToPath(params.textDocument.uri)
  const offset = doc.offsetAt(params.position)
  const result = program.getCompletions(filePath, offset)
  if (!result) return []

  return result.entries.map((e) => ({
    label: e.name,
    kind: mapCompletionKind(e.kind),
    detail: typeof e.kindModifiers === 'string' ? e.kindModifiers : undefined,
    sortText: e.sortText,
    insertText: e.insertText,
  }))
})

function mapCompletionKind(kind: ts.ScriptElementKind): CompletionItemKind {
  switch (kind) {
    case ts.ScriptElementKind.functionElement:
    case ts.ScriptElementKind.memberFunctionElement:
      return CompletionItemKind.Function
    case ts.ScriptElementKind.classElement:
      return CompletionItemKind.Class
    case ts.ScriptElementKind.interfaceElement:
      return CompletionItemKind.Interface
    case ts.ScriptElementKind.variableElement:
    case ts.ScriptElementKind.memberVariableElement:
      return CompletionItemKind.Variable
    case ts.ScriptElementKind.keyword:
      return CompletionItemKind.Keyword
    case ts.ScriptElementKind.constElement:
      return CompletionItemKind.Constant
    case ts.ScriptElementKind.moduleElement:
      return CompletionItemKind.Module
    default:
      return CompletionItemKind.Text
  }
}

connection.onDefinition((params) => {
  if (!program) return null
  const doc = documents.get(params.textDocument.uri)
  if (!doc) return null
  const filePath = uriToPath(params.textDocument.uri)
  const def = program.getDefinition(filePath, doc.offsetAt(params.position))
  if (!def?.definitions) return null
  return def.definitions.map((d) => ({
    uri: pathToFileUri(d.fileName),
    range: spanToRange(d.fileName, d.textSpan),
  }))
})

connection.onReferences((params) => {
  if (!program) return []
  const doc = documents.get(params.textDocument.uri)
  if (!doc) return []
  const filePath = uriToPath(params.textDocument.uri)
  const refs = program.getReferences(filePath, doc.offsetAt(params.position))
  if (!refs) return []
  return refs.map((r) => ({
    uri: pathToFileUri(r.fileName),
    range: spanToRange(r.fileName, r.textSpan),
  }))
})

connection.onHover((params): Hover | null => {
  if (!program) return null
  const doc = documents.get(params.textDocument.uri)
  if (!doc) return null
  const filePath = uriToPath(params.textDocument.uri)
  program.syncOpenDocument(filePath, doc.getText())
  let info: ts.QuickInfo | undefined
  try {
    info = program.getHover(filePath, doc.offsetAt(params.position))
  } catch {
    return null
  }
  if (!info) return null

  let importLine: string | undefined
  const word = wordAtPosition(doc, params.position)
  const def = program.getDefinition(filePath, doc.offsetAt(params.position))
  const firstDef = def?.definitions?.[0]
  if (firstDef && word) {
    try {
      const defPath = firstDef.fileName
      const content = fs.readFileSync(defPath, 'utf8')
      const sf = ts.createSourceFile(
        defPath,
        content,
        ts.ScriptTarget.Latest,
        true,
      )
      importLine = importLineFromDefinition(sf, firstDef.textSpan.start, word)
    } catch {
      /* ignore */
    }
  }

  const content: MarkupContent = {
    kind: MarkupKind.Markdown,
    value: formatQuickInfoMarkdown(info, importLine),
  }
  return { contents: content }
})

connection.onDocumentSymbol((params): DocumentSymbol[] => {
  if (!program) return []
  const filePath = uriToPath(params.textDocument.uri)
  const tree = program.getDocumentSymbols(filePath)
  if (!tree) return []
  return navTreeToSymbols(tree, filePath)
})

function navTreeToSymbols(
  node: ts.NavigationTree,
  filePath: string,
): DocumentSymbol[] {
  const out: DocumentSymbol[] = []
  for (const child of node.childItems ?? []) {
    const span = child.spans?.[0]
    if (!child.text || !span) continue
    const symbol: DocumentSymbol = {
      name: child.text,
      kind: navKindToSymbolKind(child.kind),
      range: spanToRange(filePath, span),
      selectionRange: spanToRange(filePath, span),
      children: navTreeToSymbols(child, filePath),
    }
    out.push(symbol)
  }
  return out
}

function navKindToSymbolKind(kind: ts.ScriptElementKind): SymbolKind {
  switch (kind) {
    case ts.ScriptElementKind.functionElement:
    case ts.ScriptElementKind.memberFunctionElement:
      return SymbolKind.Function
    case ts.ScriptElementKind.classElement:
      return SymbolKind.Class
    case ts.ScriptElementKind.interfaceElement:
      return SymbolKind.Interface
    case ts.ScriptElementKind.constElement:
      return SymbolKind.Constant
    default:
      return SymbolKind.Variable
  }
}

connection.onRenameRequest((params) => {
  if (!program) return null
  const doc = documents.get(params.textDocument.uri)
  if (!doc) return null
  const filePath = uriToPath(params.textDocument.uri)
  const locs = program.getRename(filePath, doc.offsetAt(params.position))
  if (!locs?.length) return null

  const changes: Record<
    string,
    { range: Location['range']; newText: string }[]
  > = {}
  for (const loc of locs) {
    const uri = pathToFileUri(loc.fileName)
    if (!changes[uri]) changes[uri] = []
    changes[uri].push({
      range: spanToRange(loc.fileName, loc.textSpan),
      newText: params.newName,
    })
  }
  return { changes }
})

connection.onSignatureHelp((params) => {
  if (!program) return null
  const doc = documents.get(params.textDocument.uri)
  if (!doc) return null
  const filePath = uriToPath(params.textDocument.uri)
  const help = program.getSignatureHelp(filePath, doc.offsetAt(params.position))
  if (!help?.items.length) return null

  return {
    signatures: help.items.map((item) => ({
      label: item.prefixDisplayParts?.map((p) => p.text).join('') ?? '',
      documentation: item.documentation
        ? typeof item.documentation === 'string'
          ? item.documentation
          : item.documentation.map((p) => p.text).join('')
        : undefined,
      parameters: item.parameters?.map((p) => ({
        label: p.name,
        documentation: p.displayParts?.map((x) => x.text).join(''),
      })),
    })),
    activeSignature: help.selectedItemIndex,
    activeParameter: help.argumentIndex,
  }
})
