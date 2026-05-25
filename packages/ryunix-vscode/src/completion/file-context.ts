import * as path from 'path'
import * as vscode from 'vscode'
import type { FileContextSuggestion } from '../types'

const FILE_CONTEXT_SUGGESTIONS: Record<string, FileContextSuggestion[]> = {
  'layout.ryx': [
    {
      label: 'ryx-layout',
      detail: 'Insert layout.ryx template',
      kind: vscode.CompletionItemKind.Snippet,
      insertText: new vscode.SnippetString(
        [
          'export const Metatags = {',
          '\ttitle: {',
          "\t\ttemplate: '%s | ${1:App name}',",
          "\t\tdefault: '${1:App name}',",
          '\t},',
          "\tdescription: '${2:Description}',",
          "\tviewport: 'width=device-width, initial-scale=1.0',",
          "\tcharset: 'UTF-8',",
          '}',
          '',
          'export default function ${3:RootLayout}({ children }) {',
          '\treturn children',
          '}',
        ].join('\n'),
      ),
    },
  ],
  'loading.ryx': [
    {
      label: 'ryx-loading',
      detail: 'Insert loading.ryx template',
      kind: vscode.CompletionItemKind.Snippet,
      insertText: new vscode.SnippetString(
        [
          'export default function ${1:Loading}() {',
          '\treturn (',
          '\t\t<div className="loading">',
          '\t\t\t<p>${2:Loading…}</p>',
          '\t\t</div>',
          '\t)',
          '}',
        ].join('\n'),
      ),
    },
  ],
  'error.ryx': [
    {
      label: 'ryx-error',
      detail: 'Insert error.ryx route boundary template',
      kind: vscode.CompletionItemKind.Snippet,
      insertText: new vscode.SnippetString(
        [
          'export default function ${1:RouteError}({ error, reset }) {',
          '\treturn (',
          '\t\t<main>',
          '\t\t\t<h1>${2:Something went wrong}</h1>',
          '\t\t\t<p>{error?.message}</p>',
          '\t\t\t<button type="button" onClick={reset}>${3:Try again}</button>',
          '\t\t</main>',
          '\t)',
          '}',
        ].join('\n'),
      ),
    },
  ],
  'errors.ryx': [
    {
      label: 'ryx-errors',
      detail: 'Insert errors.ryx (global not-found) template',
      kind: vscode.CompletionItemKind.Snippet,
      insertText: new vscode.SnippetString(
        [
          'export default function ${1:NotFound}() {',
          '\treturn (',
          '\t\t<main>',
          '\t\t\t<h1>${2:404}</h1>',
          '\t\t\t<p>${3:Page not found}</p>',
          '\t\t\t<a href="/">${4:Go back home}</a>',
          '\t\t</main>',
          '\t)',
          '}',
        ].join('\n'),
      ),
    },
  ],
  'index.ryx': [
    {
      label: 'ryx-page',
      detail: 'Insert index.ryx page template',
      kind: vscode.CompletionItemKind.Snippet,
      insertText: new vscode.SnippetString(
        [
          'export const Metatags = {',
          '\ttitle: "${1:Page title}",',
          "\tdescription: '${2:Description}',",
          "\tviewport: 'width=device-width, initial-scale=1.0',",
          "\tcharset: 'UTF-8',",
          '}',
          '',
          'export default function ${3:Page}() {',
          '\treturn (',
          '\t\t<main>',
          '\t\t\t${4}',
          '\t\t</main>',
          '\t)',
          '}',
        ].join('\n'),
      ),
    },
    {
      label: 'ryx-server-page',
      detail: 'Insert async server page template',
      kind: vscode.CompletionItemKind.Snippet,
      insertText: new vscode.SnippetString(
        [
          'export const Metatags = {',
          '\ttitle: "${1:Page title}",',
          "\tdescription: '${2:Description}',",
          "\tviewport: 'width=device-width, initial-scale=1.0',",
          "\tcharset: 'UTF-8',",
          '}',
          '',
          'export default async function ${3:Page}() {',
          '\treturn (',
          '\t\t<main>',
          '\t\t\t${4}',
          '\t\t</main>',
          '\t)',
          '}',
        ].join('\n'),
      ),
    },
  ],
}

export function getFileContextCompletions(
  filePath: string,
): vscode.CompletionItem[] {
  const base = path.basename(filePath)
  const defs = FILE_CONTEXT_SUGGESTIONS[base]
  if (!defs) return []

  return defs.map((d) => {
    const item = new vscode.CompletionItem(
      d.label,
      d.kind ?? vscode.CompletionItemKind.Snippet,
    )
    item.detail = d.detail
    item.insertText = d.insertText
    item.sortText = '0'
    return item
  })
}
