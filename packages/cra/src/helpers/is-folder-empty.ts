import fs from 'fs'
import picocolors from 'picocolors'

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

export function isFolderEmpty(root: string, name: string): boolean {
  const conflicts = fs
    .readdirSync(root)
    .filter((file) => !VALID_FILES.has(file))

  if (conflicts.length > 0) {
    console.log(
      `The directory ${picocolors.green(
        name,
      )} contains files that could conflict:`,
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
