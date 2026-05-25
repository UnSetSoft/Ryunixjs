'use strict'

const assert = require('assert')
const path = require('path')
const { resolveProjectRoot } = require('../server/out/ts-program')

const pkgRoot = path.resolve(__dirname, '..')
const ryunixDoc = path.resolve(pkgRoot, '../../../ryunix-doc')
const monoRoot = path.resolve(pkgRoot, '../../..')

assert.ok(
  require('fs').existsSync(path.join(ryunixDoc, 'ryunix.config.js')),
  'ryunix-doc fixture missing',
)

const docRoot = resolveProjectRoot(ryunixDoc)
assert.strictEqual(
  docRoot,
  ryunixDoc,
  `ryunix-doc: expected project root, got ${docRoot}`,
)

const fromMono = resolveProjectRoot(monoRoot)
assert.strictEqual(
  fromMono,
  ryunixDoc,
  `monorepo ryx/: expected ryunix-doc, got ${fromMono}`,
)

console.log('resolve-root.test.cjs: OK')
