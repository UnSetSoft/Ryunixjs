import spawn from 'cross-spawn'
import pc from 'picocolors'
import fs from 'fs'
import path from 'path'
import type { PackageManager } from './get-pkg-manager'

export function install(
  packageManager: PackageManager,
  cwd: string,
): Promise<void> {
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
        fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'),
      ) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
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
      process.stdout.write(`\r\x1b[K${pc.cyan(frames[i])} ${text}`)
      i = (i + 1) % frames.length
    }, 80)

    const child = spawn(packageManager, args, {
      cwd,
      stdio: 'ignore',
      env: { ...process.env, ADBLOCK: '1', DISABLE_OPENCOLLECTIVE: '1' },
    })

    child.on('close', (code: number | null) => {
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
