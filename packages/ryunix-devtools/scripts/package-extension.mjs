import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'dist-packages')
const distDir = join(root, 'dist')

const SCRIPT_FILES = [
  'background.js',
  'content-script.js',
  'devtools.js',
  'hook.js',
  'panel.js',
]

/** @param {string} value */
function stripDistPrefix(value) {
  return value.replace(/^dist\//, '')
}

/** @param {unknown} value */
function rewritePathsDeep(value) {
  if (typeof value === 'string') return stripDistPrefix(value)
  if (Array.isArray(value)) return value.map(rewritePathsDeep)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        rewritePathsDeep(entry),
      ]),
    )
  }
  return value
}

/** @param {string} html */
function rewriteHtmlScriptPaths(html) {
  return html.replace(/\bdist\//g, '')
}

function readManifest() {
  return JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'))
}

/** @param {Record<string, unknown>} base */
function buildFirefoxManifest(base) {
  const manifest = rewritePathsDeep(structuredClone(base))
  manifest.background = {
    scripts: ['background.js'],
    service_worker: 'background.js',
  }
  const gecko = base.browser_specific_settings?.gecko ?? {}
  manifest.browser_specific_settings = {
    gecko: {
      ...gecko,
      id: gecko.id ?? 'ryunix-devtools@unsetsoft',
      strict_min_version: gecko.strict_min_version ?? '109.0',
      data_collection_permissions: {
        required: ['none'],
      },
    },
  }
  return manifest
}

/** @param {string} stagingDir @param {Record<string, unknown>} manifest */
function stageFirefox(stagingDir, manifest) {
  rmSync(stagingDir, { recursive: true, force: true })
  mkdirSync(stagingDir, { recursive: true })

  writeFileSync(
    join(stagingDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )

  for (const file of ['devtools.html', 'panel.html']) {
    const html = readFileSync(join(root, file), 'utf8')
    writeFileSync(join(stagingDir, file), rewriteHtmlScriptPaths(html))
  }

  cpSync(join(root, 'icons'), join(stagingDir, 'icons'), { recursive: true })

  for (const file of SCRIPT_FILES) {
    const from = join(distDir, file)
    if (!existsSync(from)) {
      throw new Error(
        `Missing ${from}. Run "pnpm run build" in packages/ryunix-devtools first.`,
      )
    }
    cpSync(from, join(stagingDir, file))
  }
}

/** @param {string} zipPath @param {string} sourceDir */
function zipDirectory(zipPath, sourceDir) {
  execSync(`rm -f "${zipPath}"`)
  execSync(`cd "${sourceDir}" && zip -r "${zipPath}" . -x "**/.DS_Store"`, {
    stdio: 'inherit',
  })
}

mkdirSync(outDir, { recursive: true })

const baseManifest = readManifest()

// Chrome / Edge: keep dist/ layout for MV3 service worker.
const chromeZip = join(outDir, 'ryunix-devtools-chrome.zip')
execSync(`rm -f "${chromeZip}"`)
execSync(
  `cd "${root}" && zip -r "${chromeZip}" manifest.json devtools.html panel.html icons dist -x "**/.DS_Store"`,
  { stdio: 'inherit' },
)
console.log('[ryunix-devtools] Packaged ryunix-devtools-chrome.zip (chrome)')

// Firefox AMO: flat script paths, scripts fallback, data_collection_permissions.
const firefoxStaging = join(outDir, 'firefox-staging')
const firefoxManifest = buildFirefoxManifest(baseManifest)
stageFirefox(firefoxStaging, firefoxManifest)
const firefoxZip = join(outDir, 'ryunix-devtools-firefox.zip')
const firefoxXpi = join(outDir, 'ryunix_devtools-firefox.xpi')
zipDirectory(firefoxZip, firefoxStaging)
cpSync(firefoxZip, firefoxXpi)
console.log('[ryunix-devtools] Packaged ryunix-devtools-firefox.zip (firefox)')
console.log(
  '[ryunix-devtools] Packaged ryunix_devtools-firefox.xpi (firefox, AMO upload)',
)

console.log('[ryunix-devtools] Browser packages ready in dist-packages/')
