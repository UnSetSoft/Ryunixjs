const spawn = require('cross-spawn')
const pc = require('picocolors')
const fs = require('fs')
const path = require('path')

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
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'))
      const allDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
      if (allDeps.length > 0) {
        mainDepsText = allDeps.join(', ')
      }
    } catch (e) {}

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    let i = 0
    const interval = setInterval(() => {
      let text = `Installing: ${mainDepsText}`
      // Use a very safe max length to absolutely guarantee it never wraps in any terminal
      if (text.length > 50) {
        text = text.substring(0, 47) + '...'
      }
      // \r returns to start, \x1b[K clears from cursor to end of line
      process.stdout.write(`\r\x1b[K${pc.cyan(frames[i])} ${text}`)
      i = (i + 1) % frames.length
    }, 80)

    const child = spawn(packageManager, args, {
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
            `${packageManager} ${args.join(' ')} failed with exit code ${code}`
          )
        )
        return
      }
      resolve()
    })
  })
}

module.exports = { install }
