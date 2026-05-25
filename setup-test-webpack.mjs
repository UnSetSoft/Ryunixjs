#!/usr/bin/env node
/**
 * Bootstrap the local integration app at test/webpack (Ryunix docs site).
 *
 * Usage:
 *   node setup-test-webpack.mjs [--force] [--skip-build]
 *   pnpm run setup:web
 *
 * If test/webpack is missing, copies packages/cra/templates/ryunix-base as a
 * minimal fallback. The docs app (src/app, MDX) should live in test/webpack
 * and be tracked in git.
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
const FALLBACK_TEMPLATE = path.join(ROOT, 'packages/cra/templates/ryunix-base')
const TARGET_DIR = path.join(ROOT, 'test/webpack')
const DOCS_APP_MARKER = path.join(TARGET_DIR, 'src/app/index.ryx')

const args = new Set(process.argv.slice(2))
const force = args.has('--force')
const skipBuild = args.has('--skip-build')

function log(message) {
  console.log(message)
}

function fail(message) {
  console.error(`\nsetup-test-webpack: ${message}`)
  process.exit(1)
}

function run(command, commandArgs, { label }) {
  log(`\n→ ${label}`)
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.error) {
    fail(`could not run ${command}: ${result.error.message}`)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function isDocsApp(dir) {
  return (
    fs.existsSync(path.join(dir, 'ryunix.config.js')) &&
    fs.existsSync(DOCS_APP_MARKER)
  )
}

function directoryHasContent(dir) {
  if (!fs.existsSync(dir)) {
    return false
  }
  const entries = fs
    .readdirSync(dir)
    .filter((name) => !['.gitignore', '.git'].includes(name))
  return entries.length > 0
}

function writeIntegrationPackageJson() {
  const pkg = {
    name: 'ryunix-doc',
    version: '1.0.0',
    private: true,
    homepage: './',
    scripts: {
      clean: 'rm -rf .ryunix',
      dev: 'ryunix dev',
      start: 'ryunix start',
      build: 'ryunix build',
      lint: 'ryunix lint',
      'lint:fix': 'ryunix lint --fix',
    },
    dependencies: {
      '@unsetsoft/ryunixjs': 'workspace:*',
      lucide: '^0.575.0',
    },
    devDependencies: {
      '@tailwindcss/postcss': '^4.3.0',
      '@unsetsoft/ryunix-presets': 'workspace:*',
      autoprefixer: '^10.5.0',
      postcss: '^8.5.15',
      tailwindcss: '^4.3.0',
    },
    engines: {
      node: '^20 || ^22 || ^24',
    },
  }

  fs.writeFileSync(
    path.join(TARGET_DIR, 'package.json'),
    `${JSON.stringify(pkg, null, 2)}\n`,
    'utf8',
  )

  for (const nested of ['pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
    const p = path.join(TARGET_DIR, nested)
    if (fs.existsSync(p)) {
      fs.rmSync(p, { force: true })
    }
  }
}

function assertTemplateReady() {
  if (!fs.existsSync(FALLBACK_TEMPLATE)) {
    fail(`fallback template not found at ${FALLBACK_TEMPLATE}`)
  }

  for (const relativePath of ['app/index.ryx', 'ryunix.config.js']) {
    const filePath = path.join(FALLBACK_TEMPLATE, relativePath)
    if (!fs.existsSync(filePath)) {
      fail(`template is incomplete (missing ${relativePath})`)
    }
  }
}

function copyFallbackTemplate() {
  fs.mkdirSync(path.dirname(TARGET_DIR), { recursive: true })
  fs.cpSync(FALLBACK_TEMPLATE, TARGET_DIR, { recursive: true, force: true })

  const templateGitignore = path.join(FALLBACK_TEMPLATE, 'gitignore')
  if (fs.existsSync(templateGitignore)) {
    fs.copyFileSync(templateGitignore, path.join(TARGET_DIR, '.gitignore'))
  }
}

function verifySetup() {
  const indexRyx = isDocsApp(TARGET_DIR) ? 'src/app/index.ryx' : 'app/index.ryx'

  for (const relativePath of [indexRyx, 'ryunix.config.js', 'package.json']) {
    if (!fs.existsSync(path.join(TARGET_DIR, relativePath))) {
      fail(`setup incomplete (missing test/webpack/${relativePath})`)
    }
  }

  const linkedCore = path.join(TARGET_DIR, 'node_modules/@unsetsoft/ryunixjs')
  if (!fs.existsSync(linkedCore)) {
    fail(
      'workspace link missing for @unsetsoft/ryunixjs; run pnpm install from the repo root',
    )
  }
}

log('RyunixJS — setup test/webpack (docs integration app)\n')

if (directoryHasContent(TARGET_DIR) && isDocsApp(TARGET_DIR)) {
  log('Using existing ryunix-doc app at test/webpack')
  writeIntegrationPackageJson()
} else {
  if (directoryHasContent(TARGET_DIR)) {
    if (!force) {
      fail(
        'test/webpack exists but is not the docs app (missing src/app/index.ryx). Remove it or rerun with --force.',
      )
    }
    log('Removing existing test/webpack (--force)...')
    fs.rmSync(TARGET_DIR, { recursive: true, force: true })
  }

  if (fs.existsSync(DOCS_APP_MARKER)) {
    log('Configuring ryunix-doc at test/webpack')
    writeIntegrationPackageJson()
  } else {
    assertTemplateReady()
    log(
      'test/webpack not found — copying ryunix-base template (run again after adding docs sources)',
    )
    copyFallbackTemplate()
    writeIntegrationPackageJson()
  }
}

run('pnpm', ['install'], { label: 'Linking workspace packages (pnpm install)' })

if (!skipBuild) {
  run('pnpm', ['build'], { label: 'Building monorepo packages (pnpm build)' })
}

verifySetup()

log('\nDone. Start the docs dev server with:\n')
log('  pnpm run:web\n')
log('Other useful commands:')
log('  pnpm run:web:build   # production build')
log('  pnpm run:web:start   # serve production build')
log('  pnpm --filter ./test/webpack run lint')
