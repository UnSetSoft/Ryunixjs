/**
 * CI smoke: scaffold ryunix-base with workspace packages and run production build.
 * Does not require the gitignored test/webpack app.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const smokeDir = path.join(root, '_ci', 'smoke-app')
const templateDir = path.join(root, 'packages', 'cra', 'templates', 'ryunix-base')

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyRecursive(from, to)
    } else {
      fs.copyFileSync(from, to)
    }
  }
}

function patchPackageJson(appDir) {
  const pkgPath = path.join(appDir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  pkg.name = 'ryunix-ci-smoke'
  pkg.private = true
  pkg.dependencies = {
    '@unsetsoft/ryunixjs': 'workspace:*',
  }
  pkg.devDependencies = {
    '@unsetsoft/ryunix-presets': 'workspace:*',
  }
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
}

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

fs.rmSync(smokeDir, { recursive: true, force: true })
copyRecursive(templateDir, smokeDir)

const gitignoreSrc = path.join(smokeDir, 'gitignore')
if (fs.existsSync(gitignoreSrc)) {
  fs.renameSync(gitignoreSrc, path.join(smokeDir, '.gitignore'))
}

patchPackageJson(smokeDir)

console.log('\n[ci-smoke] Installing workspace (includes smoke app)...\n')
run('pnpm', ['install'], root)

console.log('\n[ci-smoke] Running ryunix build...\n')
run('pnpm', ['--filter', './_ci/smoke-app', 'run', 'build'], root)

console.log('\n[ci-smoke] Build succeeded.\n')
