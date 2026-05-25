'use strict'

const assert = require('assert')
const path = require('path')
const { resolveProjectRoot } = require('../server/out/ts-program')

const fixtures = path.join(__dirname, 'fixtures', 'resolve-root')

const withJsconfig = path.join(fixtures, 'with-jsconfig')
const withRyunixConfig = path.join(fixtures, 'with-ryunix-config')
const workspace = path.join(fixtures, 'workspace')
const nestedApp = path.join(workspace, 'apps', 'docs')

assert.strictEqual(
  resolveProjectRoot(withJsconfig),
  withJsconfig,
  'jsconfig at project root',
)

assert.strictEqual(
  resolveProjectRoot(withRyunixConfig),
  withRyunixConfig,
  'ryunix.config.js must win over src/app heuristic',
)

assert.strictEqual(
  resolveProjectRoot(workspace),
  nestedApp,
  'workspace should resolve shallowest ryunix.config.js',
)

assert.strictEqual(
  resolveProjectRoot(path.join(withRyunixConfig, 'src', 'app')),
  withRyunixConfig,
  'opening src/app should still use project root',
)

console.log('resolve-root.test.cjs: OK')
