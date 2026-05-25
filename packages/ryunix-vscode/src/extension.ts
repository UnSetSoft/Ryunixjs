import * as vscode from 'vscode'
import { registerCompletionProvider } from './completion/provider'
import { startLanguageServer, stopLanguageServer } from './lsp/client'
import { registerNavigationProviders } from './navigation/register'

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const lspEnabled = vscode.workspace
    .getConfiguration('ryunix')
    .get<boolean>('languageServer.enable', true)

  if (lspEnabled) {
    await startLanguageServer(context)
  } else {
    registerCompletionProvider(context)
  }
  registerNavigationProviders(context)
}

export function deactivate(): Thenable<void> | undefined {
  return stopLanguageServer()
}
