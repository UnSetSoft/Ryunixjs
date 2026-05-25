import * as vscode from 'vscode'
import { registerDefinitionProvider } from './definition-provider'
import { registerHoverProvider } from './hover-provider'

export function registerNavigationProviders(
  context: vscode.ExtensionContext,
): void {
  const config = vscode.workspace.getConfiguration('ryunix')
  if (config.get<boolean>('enableNavigation', true) === false) return

  registerDefinitionProvider(context)
  registerHoverProvider(context)
}
