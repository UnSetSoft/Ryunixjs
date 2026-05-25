import * as vscode from 'vscode'
import { getFileContextCompletions } from './file-context'
import { createRyunixImportCompletions } from './imports'
import {
  createRyunixImportSnippet,
  createRyunixKeywordCompletions,
} from './keywords'

const IMPORT_LINE = /import\s*\{[^}]*$/
const EMPTY_OR_FROM = /^\s*$/
const FROM_KEYWORD = /\b(from|import)\s*$/

export function registerCompletionProvider(
  context: vscode.ExtensionContext,
): void {
  const imports = createRyunixImportCompletions()
  const keywords = createRyunixKeywordCompletions()
  const importSnippet = createRyunixImportSnippet()

  const provider = vscode.languages.registerCompletionItemProvider(
    'ryunix',
    {
      provideCompletionItems(document, position) {
        const linePrefix = document
          .lineAt(position)
          .text.substring(0, position.character)

        const fileContext = getFileContextCompletions(document.fileName)

        if (IMPORT_LINE.test(linePrefix)) {
          return [...fileContext, ...imports]
        }

        if (EMPTY_OR_FROM.test(linePrefix) || FROM_KEYWORD.test(linePrefix)) {
          return [...fileContext, ...keywords, importSnippet, ...imports]
        }

        return [...fileContext, ...keywords, ...imports]
      },
    },
    '.',
    ' ',
    '{',
  )

  context.subscriptions.push(provider)
}
