import * as vscode from 'vscode'
import { HTML_TAG_DOCS } from '../constants/html-tags'
import { RYUNIX_EXPORT_DOCS } from '../constants/ryunix-exports'
import {
  getClassNameAt,
  getHtmlTagAt,
  getModuleSpecifierRange,
  getWordAt,
  isRyunixExport,
} from './document-utils'
import { getRyunixEntryFile, resolveRyunixPackageRoot } from './package-resolve'

function tailwindClassHover(className: string): vscode.Hover {
  const md = new vscode.MarkdownString(
        `**Clase CSS:** \`${className}\`\n\n` +
          'Para documentación completa de utilidades Tailwind (orden, variantes, ' +
          'conflictos), instala la extensión [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) ' +
          'y usa un proyecto con `--tailwind` de CRA.\n\n' +
          `[Buscar en Tailwind docs](https://tailwindcss.com/docs)`,
      )
  md.isTrusted = true
  return new vscode.Hover(md)
}

export function registerHoverProvider(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerHoverProvider('ryunix', {
    provideHover(document, position) {
      const word = getWordAt(document, position)

      if (getModuleSpecifierRange(document, position)) {
        const root = resolveRyunixPackageRoot(document.uri)
        const entry = root ? getRyunixEntryFile(root) : undefined
        const md = new vscode.MarkdownString(
          `**Paquete:** \`@unsetsoft/ryunixjs\`\n\n` +
            (entry
              ? `Entrada: \`${entry}\`\n\nCtrl+clic para abrir.`
              : 'Instala dependencias (`pnpm install`) para ir a la definición.'),
        )
        return new vscode.Hover(md)
      }

      const cls = getClassNameAt(document, position)
      if (cls) return tailwindClassHover(cls)

      const tag = getHtmlTagAt(document, position)
      if (tag && HTML_TAG_DOCS[tag]) {
        const md = new vscode.MarkdownString(
          `**Elemento HTML:** \`<${tag}>\`\n\n${HTML_TAG_DOCS[tag]}`,
        )
        return new vscode.Hover(md)
      }

      if (word && RYUNIX_EXPORT_DOCS[word]) {
        const md = new vscode.MarkdownString(
          `**@unsetsoft/ryunixjs** — \`${word}\`\n\n${RYUNIX_EXPORT_DOCS[word]}\n\n` +
            'Ctrl+clic para ir a la implementación en `node_modules` o `packages/core`.',
        )
        return new vscode.Hover(md)
      }

      if (word && isRyunixExport(word)) {
        return new vscode.Hover(
          new vscode.MarkdownString(
            `\`${word}\` — export de **@unsetsoft/ryunixjs**. Ctrl+clic para ir a la definición.`,
          ),
        )
      }

      return null
    },
  })

  context.subscriptions.push(provider)
}
