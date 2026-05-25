/**
 * TextMate grammar smoke tests for .ryx fixtures.
 * Run: pnpm --filter ./packages/ryunix-vscode run test
 */
const fs = require('fs')
const path = require('path')
const vscodeOniguruma = require('vscode-oniguruma')
const vscodeTextmate = require('vscode-textmate')

const grammarPath = path.join(
  __dirname,
  '../syntaxes/JavaScriptRyunix.tmLanguage.json',
)

async function tokenizeFile(filePath) {
  const wasmPath = path.join(
    path.dirname(require.resolve('vscode-oniguruma/package.json')),
    'release/onig.wasm',
  )
  await vscodeOniguruma.loadWASM(fs.readFileSync(wasmPath).buffer)

  const raw = JSON.parse(fs.readFileSync(grammarPath, 'utf8'))
  const registry = new vscodeTextmate.Registry({
    onigLib: vscodeOniguruma,
    loadGrammar: async (scopeName) =>
      scopeName === raw.scopeName ? raw : null,
  })
  const grammar = await registry.loadGrammar(raw.scopeName)
  if (!grammar) {
    throw new Error(`Failed to load grammar ${raw.scopeName}`)
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  const scopes = []
  let ruleStack = vscodeTextmate.INITIAL_STATE

  for (const line of lines) {
    const result = grammar.tokenizeLine(line, ruleStack)
    ruleStack = result.ruleStack
    for (const token of result.tokens) {
      if (token.scopes) {
        scopes.push(...token.scopes)
      }
    }
  }

  return scopes
}

function assertScopes(scopes, predicates, label) {
  for (const [name, fn] of Object.entries(predicates)) {
    if (!fn(scopes)) {
      throw new Error(
        `${label}: expected scope matching "${name}", sample: ${scopes.slice(0, 15).join(', ')}`,
      )
    }
  }
}

async function main() {
  const fixturesDir = path.join(__dirname, 'fixtures')
  const files = ['index.ryx', 'layout.ryx', 'errors.ryx']

  for (const file of files) {
    const scopes = await tokenizeFile(path.join(fixturesDir, file))
    const predicates = {
      keywordOrStorage: (s) =>
        s.some((x) => /keyword|storage\.type|storage\.modifier/i.test(x)),
    }
    if (file !== 'layout.ryx') {
      predicates.tag = (s) => s.some((x) => /tag|entity\.name\.tag/i.test(x))
    }
    assertScopes(scopes, predicates, file)
  }

  const indexScopes = await tokenizeFile(path.join(fixturesDir, 'index.ryx'))
  assertScopes(indexScopes, { string: (s) => s.some((x) => /string/i.test(x)) }, 'index.ryx strings')

  console.log(`grammar.test.cjs: OK (${files.length} fixtures)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
