import fs from 'fs'
import path from 'path'

/** True when the app uses TypeScript (typed `.ryx` is compiled as TS, not ESLint-as-JS). */
export function projectHasTsConfig(rootDir: string): boolean {
  return (
    fs.existsSync(path.join(rootDir, 'tsconfig.json')) ||
    fs.existsSync(path.join(rootDir, 'tsconfig.jsonc'))
  )
}

/** Glob patterns passed to ESLintPlugin and flat config `files`. */
export function resolveEslintFilePatterns(
  rootDir: string,
  userFiles: string[] = ['**/*.ryx'],
): string[] {
  const hasTs = projectHasTsConfig(rootDir)
  const withoutRyx = userFiles.filter((f) => !/\.ryx\b/i.test(f))

  if (hasTs) {
    const withoutTs = withoutRyx.filter((f) => !/\.tsx?\b/i.test(f))
    return [...new Set([...withoutTs, '**/*.js', '**/*.jsx'])]
  }

  return [...new Set(['**/*.ryx', ...userFiles])]
}

export function resolveEslintExtensions(rootDir: string): string[] {
  return projectHasTsConfig(rootDir) ? ['js', 'jsx'] : ['js', 'jsx', 'ryx']
}
