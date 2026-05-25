import * as path from 'path'
import * as vscode from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'

let client: LanguageClient | undefined

export async function startLanguageServer(
  context: vscode.ExtensionContext,
): Promise<void> {
  const config = vscode.workspace.getConfiguration('ryunix')
  if (config.get<boolean>('languageServer.enable', true) === false) {
    return
  }

  const serverModule = context.asAbsolutePath(
    path.join('server', 'out', 'server.js'),
  )

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6011'] },
    },
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: 'ryunix', scheme: 'file' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher(
        '**/*.{ryx,js,jsx,ts,tsx}',
      ),
    },
    initializationOptions: {
      extensionPath: context.extensionPath,
    },
  }

  client = new LanguageClient(
    'ryunixLanguageServer',
    'Ryunix Language Server',
    serverOptions,
    clientOptions,
  )

  context.subscriptions.push({
    dispose: () => client?.stop(),
  })

  await client.start()
}

export function stopLanguageServer(): Thenable<void> | undefined {
  return client?.stop()
}
