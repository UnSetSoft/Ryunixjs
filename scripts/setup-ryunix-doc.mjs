#!/usr/bin/env node
/**
 * Verify sibling ryunix-doc is linked via pnpm workspace (no test/webpack copy).
 *
 * Usage:
 *   node scripts/setup-ryunix-doc.mjs [--skip-build]
 *   pnpm run setup:web
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOC_DIR = path.resolve(ROOT, '../ryunix-doc')
const DOC_MARKER = path.join(DOC_DIR, 'src/app/index.ryx')

const args = new Set(process.argv.slice(2))
const skipBuild = args.has('--skip-build')

function fail(message) {
  console.error(`\nsetup-ryunix-doc: ${message}`)
  process.exit(1)
}

function run(command, commandArgs, { label }) {
  console.log(`\n→ ${label}`)
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log('RyunixJS — workspace link for ryunix-doc\n')

if (!fs.existsSync(DOC_MARKER)) {
  fail(
    `expected docs app at ${DOC_DIR}\n` +
      'Clone ryunix-doc next to Ryunixjs (ryx/ryunix-doc) or set pnpm-workspace.yaml accordingly.',
  )
}

run('pnpm', ['install'], { label: 'Link workspace packages (pnpm install)' })

if (!skipBuild) {
  run('pnpm', ['run', 'build:core'], { label: 'Build @unsetsoft/ryunixjs' })
}

const linkedCore = path.join(DOC_DIR, 'node_modules/@unsetsoft/ryunixjs')
if (!fs.existsSync(linkedCore)) {
  fail(`workspace link missing at ${linkedCore}; run pnpm install from ${ROOT}`)
}

console.log('\nDone. Docs integration app: ../ryunix-doc')
console.log('  pnpm run dev:doc      # ryunix dev')
console.log('  pnpm run build:doc    # production build')
console.log('  pnpm run run:web      # alias for dev:doc\n')
