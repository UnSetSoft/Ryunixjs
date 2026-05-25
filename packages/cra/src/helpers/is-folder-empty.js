'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.isFolderEmpty = isFolderEmpty
const fs_1 = __importDefault(require('fs'))
const picocolors_1 = __importDefault(require('picocolors'))
const VALID_FILES = new Set([
  '.DS_Store',
  '.git',
  '.gitattributes',
  '.gitignore',
  '.gitlab-ci.yml',
  '.hg',
  '.hgcheck',
  '.hgignore',
  '.idea',
  '.npmignore',
  '.travis.yml',
  'LICENSE',
  'Thumbs.db',
  'docs',
  'mkdocs.yml',
  'npm-debug.log',
  'yarn-debug.log',
  'yarn-error.log',
])
function isFolderEmpty(root, name) {
  const conflicts = fs_1.default
    .readdirSync(root)
    .filter((file) => !VALID_FILES.has(file))
  if (conflicts.length > 0) {
    console.log(
      `The directory ${picocolors_1.default.green(name)} contains files that could conflict:`,
    )
    console.log()
    for (const file of conflicts) {
      console.log(`  ${file}`)
    }
    console.log()
    console.log(
      'Either try using a new directory name, or remove the files listed above.',
    )
    return false
  }
  return true
}
