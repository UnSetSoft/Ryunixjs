import fs from 'fs'
import path from 'path'

const SKIP_DIRS = new Set(['node_modules', 'dist', '.ryunix'])

export function copyRecursiveSync(src: string, dest: string): void {
  const exists = fs.existsSync(src)
  const stats = exists ? fs.statSync(src) : null
  const isDirectory = exists && stats?.isDirectory()

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
    }
    for (const childItemName of fs.readdirSync(src)) {
      if (SKIP_DIRS.has(childItemName)) {
        continue
      }
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName),
      )
    }
    return
  }

  fs.copyFileSync(src, dest)
}
