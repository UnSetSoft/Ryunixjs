import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcWebpack = path.join(pkgRoot, 'webpack')
const destWebpack = path.join(pkgRoot, '.generated', 'webpack')

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(from, to)
    } else {
      fs.copyFileSync(from, to)
    }
  }
}

function walkCjs(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      walkCjs(fullPath, callback)
    } else if (entry.name.endsWith('.cjs')) {
      callback(fullPath)
    }
  }
}

walkCjs(srcWebpack, (cjsPath) => {
  const rel = path.relative(srcWebpack, cjsPath)
  copyFile(cjsPath, path.join(destWebpack, rel))
})

const templateDir = path.join(srcWebpack, 'template')
if (fs.existsSync(templateDir)) {
  copyDir(templateDir, path.join(destWebpack, 'template'))
}

console.log('[presets] synced .cjs and template/ into .generated/webpack')
