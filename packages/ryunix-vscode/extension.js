const vscode = require('vscode')

/** @type {vscode.CompletionItem[]} */
const RYUNIX_IMPORTS = [
  'useStore',
  'useReducer',
  'useEffect',
  'useLayoutEffect',
  'useRef',
  'useMemo',
  'useCallback',
  'createContext',
  'useQuery',
  'useHash',
  'useMetadata',
  'useId',
  'useDebounce',
  'useThrottle',
  'useStorePriority',
  'useTransition',
  'useDeferredValue',
  'usePersistentStore',
  'useSwitch',
  'RouterProvider',
  'useRouter',
  'Children',
  'NavLink',
  'Link',
  'usePathname',
  'useSearchParams',
  'ServerBoundary',
  'Suspense',
  'lazy',
  'memo',
].map((name) => {
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

const RYUNIX_KEYWORDS = [
  {
    label: 'Metatags',
    detail: 'Route/page SEO metadata export',
    insertText: new vscode.SnippetString(
      'export const Metatags = {\n\ttitle: ${1:"Page title"},\n\tdescription: ${2:""},\n\tviewport: "width=device-width, initial-scale=1.0",\n\tcharset: "UTF-8",\n}',
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

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const provider = vscode.languages.registerCompletionItemProvider(
    'ryunix',
    {
      provideCompletionItems(document, position) {
        const linePrefix = document
          .lineAt(position)
          .text.substring(0, position.character)

        if (/import\s*\{[^}]*$/.test(linePrefix)) {
          return RYUNIX_IMPORTS
        }

        if (
          /^\s*$/.test(linePrefix) ||
          /\b(from|import)\s*$/.test(linePrefix)
        ) {
          const fromCore = new vscode.CompletionItem(
            "import { $1 } from '@unsetsoft/ryunixjs'",
            vscode.CompletionItemKind.Snippet,
          )
          fromCore.insertText = new vscode.SnippetString(
            "import { ${1:useStore} } from '@unsetsoft/ryunixjs'",
          )
          fromCore.detail = 'Import from Ryunix core'
          return [
            ...RYUNIX_KEYWORDS.map((k) => {
              const item = new vscode.CompletionItem(
                k.label,
                vscode.CompletionItemKind.Keyword,
              )
              item.detail = k.detail
              item.insertText = k.insertText
              return item
            }),
            fromCore,
            ...RYUNIX_IMPORTS,
          ]
        }

        return [
          ...RYUNIX_KEYWORDS.map((k) => {
            const item = new vscode.CompletionItem(
              k.label,
              vscode.CompletionItemKind.Keyword,
            )
            item.detail = k.detail
            item.insertText = k.insertText
            return item
          }),
          ...RYUNIX_IMPORTS,
        ]
      },
    },
    '.',
    ' ',
    '{',
  )

  context.subscriptions.push(provider)
}

function deactivate() {}

module.exports = { activate, deactivate }
