/**
 * Diagnostic smoke tests for RyunixTsProgram.
 */
const path = require('path')
const fs = require('fs')

const { RyunixTsProgram } = require('../server/out/ts-program')

function fixtureRoot(name) {
  return path.join(__dirname, 'fixtures', 'diagnostics', name)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function main() {
  const root = fixtureRoot('')
  const extTypes = path.join(__dirname, '..')
  const program = new RyunixTsProgram(root, extTypes, { checkJsOverride: true })

  const syntaxFile = path.join(root, 'syntax-error.ryx')
  const syntaxContent = fs.readFileSync(syntaxFile, 'utf8')
  program.syncOpenDocument(syntaxFile, syntaxContent)
  const syntaxDiags = program.getDiagnostics(syntaxFile)
  assert(
    syntaxDiags.length > 0,
    `syntax-error.ryx should produce at least one diagnostic, got ${syntaxDiags.length}`,
  )

  const badImportFile = path.join(root, 'bad-import.ryx')
  const badImportContent = fs.readFileSync(badImportFile, 'utf8')
  program.syncOpenDocument(badImportFile, badImportContent)
  const importDiags = program.getDiagnostics(badImportFile)
  assert(
    importDiags.length > 0,
    'bad-import.ryx should produce semantic diagnostics with checkJs enabled',
  )

  const assetFile = path.join(root, 'asset-import.ryx')
  const assetContent = fs.readFileSync(assetFile, 'utf8')
  program.syncOpenDocument(assetFile, assetContent)
  const assetDiags = program.getDiagnostics(assetFile)
  const asset2307 = assetDiags.filter((d) => d.code === 2307)
  assert(
    asset2307.length === 0,
    `asset-import.ryx should not report false TS2307 for existing @/ SVG, got: ${asset2307.map((d) => String(d.messageText)).join('; ')}`,
  )

  for (const name of ['ryx-import-ext.ryx', 'ryx-import-no-ext.ryx']) {
    const file = path.join(root, name)
    program.syncOpenDocument(file, fs.readFileSync(file, 'utf8'))
    const diags = program.getDiagnostics(file).filter((d) => d.code === 2307)
    assert(
      diags.length === 0,
      `${name} should resolve @/components/ui/Icon(.ryx), got: ${diags.map((d) => String(d.messageText)).join('; ')}`,
    )
  }

  const imageFile = path.join(root, 'image-jsx.ryx')
  program.syncOpenDocument(imageFile, fs.readFileSync(imageFile, 'utf8'))
  const imageDiags = program.getDiagnostics(imageFile)
  const image2604 = imageDiags.filter((d) => d.code === 2604)
  assert(
    image2604.length === 0,
    `image-jsx.ryx should allow <Image /> when imported from .ryx, got: ${image2604.map((d) => String(d.messageText)).join('; ')}`,
  )

  const namedImportsFile = path.join(root, 'ryunix-named-imports.ryx')
  program.syncOpenDocument(
    namedImportsFile,
    fs.readFileSync(namedImportsFile, 'utf8'),
  )
  const namedDiags = program.getDiagnostics(namedImportsFile)
  const missingExport = namedDiags.filter(
    (d) => d.code === 2305 || d.code === 2614,
  )
  assert(
    missingExport.length === 0,
    `named imports from @unsetsoft/ryunixjs should resolve (useRouter, useStore, Link), got: ${missingExport.map((d) => String(d.messageText)).join('; ')}`,
  )

  console.log('diagnostics.test.cjs: OK')
}

main()
