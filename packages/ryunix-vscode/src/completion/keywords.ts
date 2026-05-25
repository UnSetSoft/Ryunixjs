import * as vscode from 'vscode'
import type { RyunixKeyword } from '../types'

export const RYUNIX_KEYWORDS: RyunixKeyword[] = [
  {
    label: 'Metatags',
    detail: 'Route/page SEO metadata export',
    insertText: new vscode.SnippetString(
      'export const Metatags = {\n\ttitle: ${1:"Page title"},\n\tdescription: ${2:""},\n\tviewport: "width=device-width, initial-scale=1.0",\n\tcharset: "UTF-8",\n}',
    ),
  },
  {
    label: 'frontmatter',
    detail: 'Alias for Metatags (App Router also reads frontmatter)',
    insertText: new vscode.SnippetString(
      'export const frontmatter = {\n\ttitle: ${1:"Page title"},\n\tdescription: ${2:""},\n}',
    ),
  },
  {
    label: 'generateMetadata',
    detail: 'Async metadata for SSR',
    insertText: new vscode.SnippetString(
      'export async function generateMetadata() {\n\treturn {\n\t\ttitle: ${1:"Page title"},\n\t}\n}',
    ),
  },
]

export function createRyunixKeywordCompletions(): vscode.CompletionItem[] {
  return RYUNIX_KEYWORDS.map((k) => {
    const item = new vscode.CompletionItem(
      k.label,
      vscode.CompletionItemKind.Keyword,
    )
    item.detail = k.detail
    item.insertText = k.insertText
    return item
  })
}

export function createRyunixImportSnippet(): vscode.CompletionItem {
  const fromCore = new vscode.CompletionItem(
    "import { $1 } from '@unsetsoft/ryunixjs'",
    vscode.CompletionItemKind.Snippet,
  )
  fromCore.insertText = new vscode.SnippetString(
    "import { ${1:useStore} } from '@unsetsoft/ryunixjs'",
  )
  fromCore.detail = 'Import from Ryunix core'
  return fromCore
}
