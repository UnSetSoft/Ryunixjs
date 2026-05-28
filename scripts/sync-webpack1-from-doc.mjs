#!/usr/bin/env node
/**
 * Sync test/webpack1 smoke app from sibling ryunix-doc (canonical docs site).
 *
 * Usage (from Ryunixjs repo root):
 *   node scripts/sync-webpack1-from-doc.mjs
 *   pnpm run sync:webpack1
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOC_SRC = path.resolve(ROOT, '../ryunix-doc/src')
const WEBPACK1 = path.join(ROOT, 'test/webpack1')
const WEBPACK1_SRC = path.join(WEBPACK1, 'src')
const DOC_CONFIG = path.resolve(ROOT, '../ryunix-doc/ryunix.config.js')

function fail(message) {
  console.error(`sync-webpack1: ${message}`)
  process.exit(1)
}

function copyDir(src, dest, { exclude = [] } = {}) {
  if (!fs.existsSync(src)) {
    fail(`missing source: ${src}`)
  }
  fs.mkdirSync(dest, { recursive: true })

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(from, to, { exclude })
    } else {
      fs.mkdirSync(path.dirname(to), { recursive: true })
      fs.copyFileSync(from, to)
    }
  }
}

function removeDirIfExists(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function removeNested(dir, names) {
  for (const name of names) {
    removeDirIfExists(path.join(dir, name))
  }
}

function syncConfig() {
  if (!fs.existsSync(DOC_CONFIG)) {
    fail(`missing ${DOC_CONFIG}`)
  }
  let config = fs.readFileSync(DOC_CONFIG, 'utf8')
  if (!config.includes('// false = dev')) {
    config = config.replace(
      'production: false,',
      'production: false, // false = dev; set true before pnpm build',
    )
  }
  fs.writeFileSync(path.join(WEBPACK1, 'ryunix.config.js'), config)
}

function pruneOrphans(destDir, srcDir, { exclude = [] } = {}) {
  if (!fs.existsSync(destDir)) return
  for (const entry of fs.readdirSync(destDir, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue
    const destPath = path.join(destDir, entry.name)
    const srcPath = path.join(srcDir, entry.name)
    if (!fs.existsSync(srcPath)) {
      fs.rmSync(destPath, { recursive: true, force: true })
      continue
    }
    if (entry.isDirectory()) {
      pruneOrphans(destPath, srcPath, { exclude })
    }
  }
}

console.log('Syncing test/webpack1 from ../ryunix-doc …\n')

if (!fs.existsSync(WEBPACK1)) {
  fail('test/webpack1 not found — create the smoke app folder first')
}

removeNested(path.join(WEBPACK1_SRC, 'app'), ['en', 'es'])
copyDir(DOC_SRC, WEBPACK1_SRC, { exclude: [] })
pruneOrphans(WEBPACK1_SRC, DOC_SRC, { exclude: [] })
removeNested(path.join(WEBPACK1_SRC, 'app'), ['en', 'es'])

syncConfig()

console.log('Done.')
console.log('  src/app/[locale]/ — locale routes')
console.log('  src/content/docs/{en,es}/ — MDX content')
console.log('\nNext: cd test/webpack1 && pnpm run clean && pnpm run build')
