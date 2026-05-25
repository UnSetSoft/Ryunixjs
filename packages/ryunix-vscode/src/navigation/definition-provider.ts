import * as vscode from 'vscode'
import {
  getModuleSpecifierRange,
  getWordAt,
  isRyunixExport,
} from './document-utils'
import {
  findRyunixSymbolLocation,
  getRyunixEntryFile,
  resolveRyunixPackageRoot,
} from './package-resolve'

export function registerDefinitionProvider(
  context: vscode.ExtensionContext,
): void {
  const provider = vscode.languages.registerDefinitionProvider('ryunix', {
    provideDefinition(document, position) {
      const pkgRoot = resolveRyunixPackageRoot(document.uri)
      if (!pkgRoot) return null

      const moduleRange = getModuleSpecifierRange(document, position)
      if (moduleRange) {
        const entry = getRyunixEntryFile(pkgRoot)
        if (entry) {
          return new vscode.Location(
            vscode.Uri.file(entry),
            new vscode.Position(0, 0),
          )
        }
      }

      const word = getWordAt(document, position)
      if (!word) return null

      if (isRyunixExport(word)) {
        const loc = findRyunixSymbolLocation(pkgRoot, word)
        if (loc) return loc
      }

      return null
    },
  })

  context.subscriptions.push(provider)
}
