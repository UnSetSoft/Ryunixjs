import babel from '@babel/core';
import { createHash } from 'crypto';

export default async function ryunixServerActionLoader(source) {
  if (!/^\s*\/\/\s*@server/m.test(source)) {
    return source;
  }

  const callback = this.async();
  const isServer = this.target === 'node' || (this._compiler && this._compiler.name === 'server');
  const hash = createHash('sha256').update(this.resourcePath).digest('hex').slice(0, 8);
  const actionNames = [];

  try {
    const result = await babel.transformAsync(source, {
      filename: this.resourcePath,
      plugins: [
        function({ types: t }) {
          return {
            visitor: {
              ExportNamedDeclaration(path) {
                const declaration = path.node.declaration;
                
                if (t.isFunctionDeclaration(declaration) && declaration.async) {
                  const name = declaration.id.name;
                  actionNames.push(name);
                  const actionId = `${hash}_${name}`;

                  if (!isServer) {
                    path.replaceWith(
                      t.exportNamedDeclaration(
                        t.variableDeclaration("const", [
                          t.variableDeclarator(
                            t.identifier(name),
                            t.callExpression(
                              t.identifier('__ryunixCreateActionProxy'),
                              [t.stringLiteral(actionId)]
                            )
                          )
                        ])
                      )
                    );
                  }
                } else if (t.isVariableDeclaration(declaration)) {
                  let hasAsyncArrow = false;
                  declaration.declarations.forEach(decl => {
                    if ((t.isArrowFunctionExpression(decl.init) || t.isFunctionExpression(decl.init)) && decl.init.async) {
                      const name = decl.id.name;
                      actionNames.push(name);
                      hasAsyncArrow = true;
                      
                      if (!isServer) {
                        const actionId = `${hash}_${name}`;
                        decl.init = t.callExpression(
                          t.identifier('__ryunixCreateActionProxy'),
                          [t.stringLiteral(actionId)]
                        );
                      }
                    }
                  });
                }
              }
            }
          };
        }
      ]
    });

    let code = result.code;

    if (isServer && actionNames.length > 0) {
      code += `\n\n// Ryunix Server Actions Registration`;
      code += `\nif (typeof globalThis.__RYUNIX_SERVER_ACTIONS__ === 'undefined') {`;
      code += `\n  globalThis.__RYUNIX_SERVER_ACTIONS__ = {};`;
      code += `\n}`;
      actionNames.forEach(name => {
        const actionId = `${hash}_${name}`;
        code += `\nglobalThis.__RYUNIX_SERVER_ACTIONS__['${actionId}'] = ${name};`;
      });
    }

    if (!isServer && actionNames.length > 0) {
      // For client side, import the proxy creator
      code = `import { createActionProxy as __ryunixCreateActionProxy } from '@unsetsoft/ryunixjs';\n` + code;
    }

    callback(null, code);
  } catch (err) {
    callback(err);
  }
}
