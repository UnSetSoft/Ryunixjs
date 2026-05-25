import * as vscode from 'vscode'
import { RYUNIX_EXPORT_NAMES } from '../constants/ryunix-exports'

export function createRyunixImportCompletions(): vscode.CompletionItem[] {
  return RYUNIX_EXPORT_NAMES.map((name) => {
    const item = new vscode.CompletionItem(
      name,
      vscode.CompletionItemKind.Function,
    )
    item.detail = '@unsetsoft/ryunixjs'
    item.documentation = 'Ryunix core export'
    item.insertText =
      name === 'createContext'
        ? new vscode.SnippetString('createContext(${1:defaultValue})')
        : new vscode.SnippetString(`${name}($1)`)
    return item
  })
}
