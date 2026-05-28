/**
 * Syncs manifest.json version from package.json.
 * WebExtension manifests require 1–4 dot-separated integers (0–65535 each).
 * Semver prereleases map to a 4th segment, e.g. 1.2.3-canary.1 → 1.2.3.1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/** @param {string} version */
export function toExtensionVersion(version) {
  const match = version.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-(?:canary|beta|alpha|rc)\.(\d+))?$/,
  )
  if (!match) {
    const numeric = version.match(/^(\d+)\.(\d+)\.(\d+)/)
    if (numeric) {
      return `${numeric[1]}.${numeric[2]}.${numeric[3]}`
    }
    throw new Error(
      `Cannot map "${version}" to a WebExtension version (expected semver like 1.3.1 or 1.2.3-canary.1)`,
    )
  }

  const [, major, minor, patch, prerelease] = match
  return prerelease
    ? `${major}.${minor}.${patch}.${prerelease}`
    : `${major}.${minor}.${patch}`
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const manifestPath = path.join(root, 'manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

manifest.version = toExtensionVersion(pkg.version)

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`[sync-manifest] manifest.version = ${manifest.version}`)
