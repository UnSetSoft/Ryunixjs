import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { resolvePostcssPlugins } from '../../.generated/webpack/utils/postcss-config.js'

function writeJson(dir, name, data) {
  fs.writeFileSync(path.join(dir, name), JSON.stringify(data))
}

test('resolvePostcssPlugins loads ESM postcss.config.js when type is module', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ryx-postcss-esm-'))
  writeJson(dir, 'package.json', { type: 'module', name: 'test-app' })
  fs.writeFileSync(
    path.join(dir, 'postcss.config.js'),
    `export default { plugins: [{ postcssPlugin: 'test-stub', Once() {} }] }\n`,
  )

  const originalCwd = process.cwd()
  process.chdir(dir)
  try {
    const plugins = await resolvePostcssPlugins(dir)
    assert.equal(plugins.length, 1)
    assert.ok(plugins[0])
  } finally {
    process.chdir(originalCwd)
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('resolvePostcssPlugins loads CJS postcss.config.cjs', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ryx-postcss-cjs-'))
  writeJson(dir, 'package.json', { name: 'test-app' })
  fs.writeFileSync(
    path.join(dir, 'postcss.config.cjs'),
    `module.exports = { plugins: [{ postcssPlugin: 'test-stub', Once() {} }] }\n`,
  )

  const plugins = await resolvePostcssPlugins(dir)
  assert.equal(plugins.length, 1)
  fs.rmSync(dir, { recursive: true, force: true })
})
