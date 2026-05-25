import type * as vscode from 'vscode'

export type FileContextSuggestion = {
  label: string
  detail: string
  insertText: vscode.SnippetString
  kind?: vscode.CompletionItemKind
}

export type RyunixKeyword = {
  label: string
  detail: string
  insertText: vscode.SnippetString
}
