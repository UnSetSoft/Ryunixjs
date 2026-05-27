import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import AppRouterPlugin from '../../.generated/webpack/utils/appRouterPlugin.js'

const findRoute = (node, targetPath) => {
  if (!node) return null
  const list = Array.isArray(node) ? node : [node]
  for (const item of list) {
    if (Array.isArray(item)) {
      const found = findRoute(item, targetPath)
      if (found) return found
      continue
    }
    if (item.path === targetPath && item.index) return item
    const nested = findRoute(item.children, targetPath)
    if (nested) return nested
  }
  return null
}

test('scanDirectory registers flat .mdx files as routes', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ryx-flat-mdx-'))
  const guidesDir = path.join(tmp, 'guides')
  fs.mkdirSync(guidesDir, { recursive: true })
  fs.writeFileSync(
    path.join(guidesDir, 'create-app.mdx'),
    '---\ntitle: Create App\n---\n\n# Create App\n',
  )
  fs.mkdirSync(path.join(guidesDir, 'cli'))
  fs.writeFileSync(
    path.join(guidesDir, 'cli', 'index.mdx'),
    '---\ntitle: CLI\n---\n\n# CLI\n',
  )

  const plugin = new AppRouterPlugin({ appDir: tmp })
  const routes = plugin.scanDirectory(tmp, '')

  const flatRoute = findRoute(routes, '/guides/create-app')
  assert.ok(flatRoute, 'expected /guides/create-app from create-app.mdx')
  assert.match(flatRoute.index.path, /create-app\.mdx$/)

  const folderRoute = findRoute(routes, '/guides/cli')
  assert.ok(folderRoute, 'expected /guides/cli from cli/index.mdx')

  fs.rmSync(tmp, { recursive: true, force: true })
})

test('scanDirectory prefers folder over flat .mdx with the same name', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ryx-flat-mdx-conflict-'))
  const segmentDir = path.join(tmp, 'docs')
  fs.mkdirSync(segmentDir, { recursive: true })
  fs.writeFileSync(
    path.join(segmentDir, 'about.mdx'),
    '---\ntitle: Flat\n---\n\n# Flat\n',
  )
  fs.mkdirSync(path.join(segmentDir, 'about'))
  fs.writeFileSync(
    path.join(segmentDir, 'about', 'index.mdx'),
    '---\ntitle: Folder\n---\n\n# Folder\n',
  )

  const plugin = new AppRouterPlugin({ appDir: tmp })
  const routes = plugin.scanDirectory(tmp, '')

  const route = findRoute(routes, '/docs/about')
  assert.ok(route)
  assert.match(route.index.path, /about[/\\]index\.mdx$/)

  fs.rmSync(tmp, { recursive: true, force: true })
})
