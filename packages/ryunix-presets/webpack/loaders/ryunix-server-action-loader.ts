import babel from '@babel/core'
import { createHash } from 'crypto'

export default async function ryunixServerActionLoader(source) {
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
  const actionNames = []

  try {
    const result = await babel.transformAsync(source, {
      filename: this.resourcePath,
      plugins: [
        function ({ types: t }) {
          return {
            visitor: {
              ExportNamedDeclaration(path) {
                const declaration = path.node.declaration

                if (t.isFunctionDeclaration(declaration) && declaration.async) {
                  const name = declaration.id.name
                  actionNames.push(name)
                  const actionId = `${hash}_${name}`

                  // We don't transform the AST for client builds here anymore,
                  // we just let it collect the actionNames and completely replace the client source string at the end.
                } else if (t.isVariableDeclaration(declaration)) {
                  let hasAsyncArrow = false
                  declaration.declarations.forEach((decl) => {
                    if (
                      (t.isArrowFunctionExpression(decl.init) ||
                        t.isFunctionExpression(decl.init)) &&
                      decl.init.async
                    ) {
                      const name = decl.id.name
                      actionNames.push(name)
                      hasAsyncArrow = true
                    }
                  })
                }
              },
            },
          }
        },
      ],
    })

    let code = result.code

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
  } catch (err) {
    callback(err)
  }
}
