import * as vscode from 'vscode'
import { registerCompletionProvider } from './completion/provider'
import { registerNavigationProviders } from './navigation/register'

export function activate(context: vscode.ExtensionContext): void {
  registerCompletionProvider(context)
  registerNavigationProviders(context)
}

export function deactivate(): void {}
