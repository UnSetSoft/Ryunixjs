'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.copyRecursiveSync = copyRecursiveSync
const fs_1 = __importDefault(require('fs'))
const path_1 = __importDefault(require('path'))
const SKIP_DIRS = new Set(['node_modules', 'dist', '.ryunix'])
function copyRecursiveSync(src, dest) {
  const exists = fs_1.default.existsSync(src)
  const stats = exists ? fs_1.default.statSync(src) : null
  const isDirectory = exists && stats?.isDirectory()
  if (isDirectory) {
    if (!fs_1.default.existsSync(dest)) {
      fs_1.default.mkdirSync(dest)
    }
    for (const childItemName of fs_1.default.readdirSync(src)) {
      if (SKIP_DIRS.has(childItemName)) {
        continue
      }
      copyRecursiveSync(
        path_1.default.join(src, childItemName),
        path_1.default.join(dest, childItemName),
      )
    }
    return
  }
  fs_1.default.copyFileSync(src, dest)
}
