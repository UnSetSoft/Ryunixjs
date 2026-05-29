import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'dist-packages')

mkdirSync(outDir, { recursive: true })

const targets = [
  { name: 'chrome', file: 'ryunix-devtools-chrome.zip' },
  { name: 'firefox', file: 'ryunix-devtools-firefox.zip' },
]

for (const target of targets) {
  const zipPath = join(outDir, target.file)
  execSync(`rm -f "${zipPath}"`)
  execSync(
    `cd "${root}" && zip -r "${zipPath}" manifest.json devtools.html panel.html icons dist -x "**/.DS_Store"`,
    { stdio: 'inherit' },
  )
  console.log(`[ryunix-devtools] Packaged ${target.file} (${target.name})`)
}

console.log('[ryunix-devtools] Browser packages ready in dist-packages/')
