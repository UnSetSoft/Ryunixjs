import babel from '@babel/core'
import { createHash } from 'crypto'
import type { LoaderContext } from 'webpack'

interface ExportNamedDeclarationPath {
  node: {
    declaration: unknown
  }
}

interface BabelPluginTypes {
  isFunctionDeclaration(
    node: unknown,
  ): node is { async: boolean; id?: { name: string } | null }
  isVariableDeclaration(
    node: unknown,
  ): node is { declarations: Array<{ id: unknown; init?: unknown }> }
  isIdentifier(node: unknown): node is { name: string }
  isArrowFunctionExpression(node: unknown): node is { async: boolean }
  isFunctionExpression(node: unknown): node is { async: boolean }
}

export default async function ryunixServerActionLoader(
  this: LoaderContext<unknown>,
  source: string,
) {
  if (!/^\s*\/\/\s*@server/m.test(source)) {
    return source
  }

  const callback = this.async()
  const isServer =
    this.target === 'node' ||
    (this._compiler && this._compiler.name === 'server')
  const hash = createHash('sha256')
    .update(this.resourcePath)
    .digest('hex')
    .slice(0, 8)
  const actionNames: string[] = []

  try {
    const result = await babel.transformAsync(source, {
      filename: this.resourcePath,
      plugins: [
        function ({ types: t }: { types: BabelPluginTypes }) {
          return {
            visitor: {
              ExportNamedDeclaration(path: ExportNamedDeclarationPath) {
                const declaration = path.node.declaration

                if (t.isFunctionDeclaration(declaration) && declaration.async) {
                  const name = declaration.id?.name
                  if (!name) return
                  actionNames.push(name)

                  // We don't transform the AST for client builds here anymore,
                  // we just let it collect the actionNames and completely replace the client source string at the end.
                } else if (t.isVariableDeclaration(declaration)) {
                  declaration.declarations.forEach((decl) => {
                    if (
                      t.isIdentifier(decl.id) &&
                      (t.isArrowFunctionExpression(decl.init) ||
                        t.isFunctionExpression(decl.init)) &&
                      decl.init.async
                    ) {
                      const name = decl.id.name
                      actionNames.push(name)
                    }
                  })
                }
              },
            },
          }
        },
      ],
    })

    let code = result?.code ?? source

    if (isServer && actionNames.length > 0) {
      code += `\n\n// Ryunix Server Actions Registration`
      code += `\nif (typeof globalThis.__RYUNIX_SERVER_ACTIONS__ === 'undefined') {`
      code += `\n  globalThis.__RYUNIX_SERVER_ACTIONS__ = {};`
      code += `\n}`
      actionNames.forEach((name) => {
        const actionId = `${hash}_${name}`
        code += `\nglobalThis.__RYUNIX_SERVER_ACTIONS__['${actionId}'] = ${name};`
      })
    }

    if (!isServer) {
      if (actionNames.length > 0) {
        let clientCode = `import { createActionProxy as __ryunixCreateActionProxy } from '@unsetsoft/ryunixjs';\n`
        actionNames.forEach((name) => {
          clientCode += `export const ${name} = __ryunixCreateActionProxy("${hash}_${name}");\n`
        })
        code = clientCode
      } else {
        code = '// This file is server-only'
      }
    }

    callback(null, code)
  } catch (err: unknown) {
    callback(err instanceof Error ? err : new Error(String(err)))
  }
}
