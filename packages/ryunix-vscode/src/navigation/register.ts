import * as vscode from 'vscode'
import { registerDefinitionProvider } from './definition-provider'
import { registerHoverProvider } from './hover-provider'

export function registerNavigationProviders(
  context: vscode.ExtensionContext,
): void {
  const config = vscode.workspace.getConfiguration('ryunix')
  if (config.get<boolean>('enableNavigation', true) === false) return

  /** Hover for HTML tags / className always complements the LSP. */
  registerHoverProvider(context)

  if (config.get<boolean>('languageServer.enable', true)) return

  registerDefinitionProvider(context)
}
