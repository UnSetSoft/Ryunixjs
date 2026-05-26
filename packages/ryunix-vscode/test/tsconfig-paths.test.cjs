/**
 * Tests for ryunix.config.js → compilerOptions.paths mapping.
 */
const path = require('path')
const fs = require('fs')
const os = require('os')

const {
  pathsFromRyunixConfig,
  mergeCompilerPaths,
  hasPathPrefix,
} = require('../server/out/ryunix-config-paths')
const { loadCompilerOptions } = require('../server/out/ts-program')
const { resolveRyunixTypesEntry } = require('../server/out/ryunix-types-resolve')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function withTempRyunixConfig(content, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ryx-paths-'))
  fs.writeFileSync(path.join(dir, 'ryunix.config.js'), content)
  try {
    fn(dir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function main() {
  withTempRyunixConfig(
    `module.exports = { webpack: { resolve: { alias: { '@': './src' } } } }`,
    (dir) => {
      const paths = pathsFromRyunixConfig(dir)
      assert(paths['@/*'], 'expected @/* path from ryunix.config.js')
      assert(
        paths['@/*'][0].includes('src'),
        '@/* should map to src directory',
      )
    },
  )

  assert(
    hasPathPrefix({ '@/*': ['./src/*'] }, '@'),
    'hasPathPrefix should detect @',
  )
  assert(
    !hasPathPrefix({}, '@'),
    'hasPathPrefix should be false for empty paths',
  )

  const merged = mergeCompilerPaths(
    { '@unsetsoft/ryunixjs': ['node_modules/@unsetsoft/ryunixjs'] },
    { '@/*': ['./src/*'] },
  )
  assert(merged['@/*'], 'mergeCompilerPaths should add alias paths')

  const fixtureRoot = path.join(
    __dirname,
    'fixtures/resolve-root/with-ryunix-config',
  )
  const opts = loadCompilerOptions(fixtureRoot, { preferTsconfig: false })
  assert(opts.paths, 'loadCompilerOptions should return paths object')

  const monorepoRoot = path.join(__dirname, '..', '..', '..')
  const coreTypes = resolveRyunixTypesEntry(monorepoRoot)
  assert(
    coreTypes && coreTypes.includes('packages/core/types/index.d.ts'),
    'resolveRyunixTypesEntry should find monorepo core types',
  )

  console.log('tsconfig-paths.test.cjs: OK')
}

main()
