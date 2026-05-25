'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.install = install
const cross_spawn_1 = __importDefault(require('cross-spawn'))
const picocolors_1 = __importDefault(require('picocolors'))
const fs_1 = __importDefault(require('fs'))
const path_1 = __importDefault(require('path'))
function install(packageManager, cwd) {
  return new Promise((resolve, reject) => {
    const args = ['install']
    if (packageManager === 'npm') {
      args.push('--no-audit', '--no-fund', '--loglevel=error')
    } else if (packageManager === 'yarn' || packageManager === 'pnpm') {
      args.push('--silent')
    }
    let mainDepsText = 'dependencies'
    try {
      const pkg = JSON.parse(
        fs_1.default.readFileSync(
          path_1.default.join(cwd, 'package.json'),
          'utf8',
        ),
      )
      const allDeps = Object.keys({
        ...pkg.dependencies,
        ...pkg.devDependencies,
      })
      if (allDeps.length > 0) {
        mainDepsText = allDeps.join(', ')
      }
    } catch {
      // keep default label
    }
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    let i = 0
    const interval = setInterval(() => {
      let text = `Installing: ${mainDepsText}`
      if (text.length > 50) {
        text = text.substring(0, 47) + '...'
      }
      process.stdout.write(
        `\r\x1b[K${picocolors_1.default.cyan(frames[i])} ${text}`,
      )
      i = (i + 1) % frames.length
    }, 80)
    const child = (0, cross_spawn_1.default)(packageManager, args, {
      cwd,
      stdio: 'ignore',
      env: { ...process.env, ADBLOCK: '1', DISABLE_OPENCOLLECTIVE: '1' },
    })
    child.on('close', (code) => {
      clearInterval(interval)
      process.stdout.write('\r\x1b[K')
      if (code !== 0) {
        reject(
          new Error(
            `${packageManager} ${args.join(' ')} failed with exit code ${code}`,
          ),
        )
        return
      }
      resolve()
    })
  })
}
