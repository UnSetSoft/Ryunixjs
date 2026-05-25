'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.tryGitInit = tryGitInit
const child_process_1 = require('child_process')
const path_1 = __importDefault(require('path'))
const fs_1 = __importDefault(require('fs'))
function tryGitInit(root) {
  let didInit = false
  try {
    ;(0, child_process_1.execSync)('git --version', { stdio: 'ignore' })
    if (fs_1.default.existsSync(path_1.default.join(root, '.git'))) {
      return false
    }
    ;(0, child_process_1.execSync)('git init', { stdio: 'ignore', cwd: root })
    didInit = true
    try {
      ;(0, child_process_1.execSync)('git checkout -b main', {
        stdio: 'ignore',
        cwd: root,
      })
    } catch {
      try {
        ;(0, child_process_1.execSync)('git branch -m main', {
          stdio: 'ignore',
          cwd: root,
        })
      } catch {
        // Assume latest git already defaults to main
      }
    }
    ;(0, child_process_1.execSync)('git add -A', { stdio: 'ignore', cwd: root })
    ;(0, child_process_1.execSync)(
      'git commit -m "Initial commit from Create Ryunix App"',
      {
        stdio: 'ignore',
        cwd: root,
      },
    )
    return true
  } catch {
    if (didInit) {
      try {
        fs_1.default.rmSync(path_1.default.join(root, '.git'), {
          recursive: true,
          force: true,
        })
      } catch {
        // ignore cleanup failure
      }
    }
    return false
  }
}
