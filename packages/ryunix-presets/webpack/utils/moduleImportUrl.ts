import { pathToFileURL } from 'node:url'

/**
 * Build a dynamic import URL from an absolute filesystem path.
 * Uses pathToFileURL instead of `file://${path}` so webpack FileSystemInfo
 * does not treat the template literal as a resolvable file: dependency.
 */
export function moduleImportUrl(filePath: string, bustCache = false): string {
  const href = pathToFileURL(filePath).href
  return bustCache ? `${href}?update=${Date.now()}` : href
}
