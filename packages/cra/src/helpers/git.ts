import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

export function tryGitInit(root: string): boolean {
  let didInit = false
  try {
    execSync('git --version', { stdio: 'ignore' })
    if (fs.existsSync(path.join(root, '.git'))) {
      return false
    }

    execSync('git init', { stdio: 'ignore', cwd: root })
    didInit = true

    try {
      execSync('git checkout -b main', { stdio: 'ignore', cwd: root })
    } catch {
      try {
        execSync('git branch -m main', { stdio: 'ignore', cwd: root })
      } catch {
        // Assume latest git already defaults to main
      }
    }

    execSync('git add -A', { stdio: 'ignore', cwd: root })
    execSync('git commit -m "Initial commit from Create Ryunix App"', {
      stdio: 'ignore',
      cwd: root,
    })
    return true
  } catch {
    if (didInit) {
      try {
        fs.rmSync(path.join(root, '.git'), { recursive: true, force: true })
      } catch {
        // ignore cleanup failure
      }
    }
    return false
  }
}
